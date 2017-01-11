import {Component, OnInit, ViewChild} from '@angular/core';
import {MapService, Tile} from '../../services/map.service';
import {AirportPickerComponent} from '../airport-picker/airport-picker.component';
// import {ToggleComponent} from '../toggle/toggle.component';
import {GeoHelperService} from '../../services/geo-helper.service';
import {Airport} from "../../classes/airport";
import {SimulatorService} from '../../services/simulator.service';
import {Airplane} from "../../classes/airplane";

import * as Rx from 'rxjs';
import 'leaflet';
import * as d3 from 'd3';
import 'leaflet-d3-svg-overlay';
import {AlertManager} from "../../classes/alert-manager";


@Component({
    selector: 'app-mainview',
    templateUrl: './mainview.component.html',
    styleUrls: ['./mainview.component.css']
})


export class MainviewComponent implements OnInit {

    map: any; //the leaflet map object
    isEditRouteMode: boolean; //flag route edit mode
    @ViewChild(AirportPickerComponent) public readonly modal: AirportPickerComponent;
    whichAirport: string; // which airport button was clicked
    toAirport: Airport;
    landAirport: Airport;

    routePoints: Array<{lat: number, lng: number}>;

    //layers
    greatCircleLayer: L.Layer;
    airplaneLayer: L.Layer;
    turbulenceLayer: L.Layer;

    isEditMode: boolean = false;

    simSpeed: number;

    airplane: Airplane;
    turbulenceAtAlt: Tile [] = [];
    isDayLayer: boolean = true;

    selectedAltitude: number = 1;
    isAutoAlt: boolean = false; //when auto alt is selected
    isFollowAlt: boolean = true; //should the display follow to altitude of the airplane when in auto alt mode

    observerHook: any;
    simulatedAirplanes: Array <Airplane>;

    //alert box
    isAlertBoxShow: boolean = false;
    bottomAlertColor: string;
    currentAlertColor: string;
    topAlertColor: string;
    kAlertAngle: number = 15;
    kAlertRange: number = 100;

    /***********************
     *  constractor
     **********************/
    constructor(private mapService: MapService, private  geoHelperService: GeoHelperService, private simulatorService: SimulatorService) {
        this.mapService = mapService;
        this.geoHelperService = geoHelperService;
        this.isEditRouteMode = false;
        //layers
        this.greatCircleLayer = null;

        this.simSpeed = 5;
        this.simulatorService.setTimeTickSpeed(5);
        this.observerHook = this.simulatorService.getSimTicker().subscribe((item) => {
            this.simTick();
        });

    }

    /***********************
     *  onInit
     **********************/
    ngOnInit() {


        //init map
        this.initMapControl();
        this.initMapEvents();

        this.toAirport = {
            ICAO: "LLBG",
            altitude: "135",
            city: "Tel-aviv",
            country: "Israel",
            latitude: 32.011389,
            longitude: 34.886667,
            name: "Ben Gurion",
            symbol: "TLV"
        };
        this.landAirport = {
            ICAO: "KJFK",
            altitude: "13",
            city: "New York",
            country: "United States",
            latitude: 40.639751,
            longitude: -73.778925,
            name: "John F Kennedy Intl",
            symbol: "JFK"
        };

        this.initRoute();
        this.initSsimulatedAirplanes();

    }

    ngOnDestroy() {
        this.observerHook.unsubscribe();
    }

    /***************************
     init map
     ***************************/
    initMapControl() {

        this.map = L.map('mapid', {
            zoomControl: false,
            center: L.latLng(33.5, 32.0),
            zoom: 6,
        });

        // let osmUrl = 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
        const osmUrl = this.mapService.mapLayerURL;
        const osmAttrib = 'Map data © <a href="http://openstreetmap.org">OpenStreetMap</a> contributors';
        const osm = L.tileLayer(osmUrl, {minZoom: 3, maxZoom: 7, attribution: osmAttrib});

        // start the map in South-East England
        this.map.setView(L.latLng(51.3, 0.7), 3);
        this.map.addLayer(osm);


    }

    /***************************
     init map events
     ***************************/
    initMapEvents() {
        this.map.on('zoomend', () => {
            this.redrawAll();
        });

    }

    /***********************
     *  airport selection
     **********************/
    showModal(e, which) {
        this.whichAirport = which === 'takeoff' ? 'takeoff' : 'landing';
        this.modal.show(e.clientX - 200, e.clientY);
    }

    airportSelected(airport: Airport) {
        if (this.whichAirport === 'takeoff') {
            this.toAirport = airport;
        } else {
            this.landAirport = airport;
        }
        this.initRoute();
    }

    swapAirports() {
        const tmp = this.landAirport;
        this.landAirport = this.toAirport;
        this.toAirport = tmp;
        this.initRoute();

    }

    /***********************
     *  route
     **********************/
    initRoute() {
        this.routePoints = [];
        this.routePoints.push({lat: this.toAirport.latitude, lng: this.toAirport.longitude});
        this.routePoints.push({lat: this.landAirport.latitude, lng: this.landAirport.longitude});
        this.airplane = new Airplane({
            lat: this.toAirport.latitude,
            lng: this.toAirport.longitude
        }, {lat: this.landAirport.latitude, lng: this.landAirport.longitude}, 32000);

        this.redrawAll();
        this.map.fitBounds([
            [this.toAirport.latitude, this.toAirport.longitude],
            [this.landAirport.latitude, this.landAirport.longitude],

        ]);
    }

    /***********************
     * airplane
     **********************/
    simSlow() {
        if (this.simSpeed > 1) this.simSpeed -= 1;
        this.simulatorService.setTimeTickSpeed(this.simSpeed);
    }

    simFast() {
        if (this.simSpeed < 8) this.simSpeed += 1;

        this.simulatorService.setTimeTickSpeed(this.simSpeed);
    }

    gotoAltitude(altitude) {
        this.airplane.gotoAltitude(Number(altitude.target.value));
        this.isFollowAlt = true;
    }

    /*********************
     * simulted airplanes
     ********************/
    initSsimulatedAirplanes() {
        this.simulatedAirplanes = [];
        this.simulatedAirplanes.push(new Airplane({lat: 30, lng: 40}, {lat: 30, lng: -120}, 38000));
        this.simulatedAirplanes.push(new Airplane({lat: 30, lng: 30}, {lat: 30, lng: 40}, 38000));
        this.simulatedAirplanes.push(new Airplane({lat: 30, lng: 40}, {lat: 20, lng: 90}, 38000));
        this.simulatedAirplanes.push(new Airplane({lat: 30, lng: 40}, {lat: 30, lng: -120}, 38000));
        this.simulatedAirplanes.push(new Airplane({lat: 30, lng: 40}, {lat: 30, lng: -120}, 38000));
        this.simulatedAirplanes.push(new Airplane({lat: 30, lng: 40}, {lat: 30, lng: -120}, 38000));
        this.simulatedAirplanes.push(new Airplane({lat: 30, lng: 40}, {lat: 30, lng: -120}, 38000));
        this.simulatedAirplanes.push(new Airplane({lat: 30, lng: 40}, {lat: 30, lng: -120}, 38000));
        this.simulatedAirplanes.push(new Airplane({lat: 30, lng: 40}, {lat: 30, lng: -120}, 38000));
        this.simulatedAirplanes.push(new Airplane({lat: 30, lng: 40}, {lat: 30, lng: -120}, 38000));
        this.simulatedAirplanes.push(new Airplane({lat: 30, lng: 40}, {lat: 30, lng: -120}, 38000));
        this.simulatedAirplanes.push(new Airplane({lat: 30, lng: 40}, {lat: 30, lng: -120}, 38000));
        this.simulatedAirplanes.push(new Airplane({lat: 30, lng: 40}, {lat: 20, lng: 90}, 38000));
        this.simulatedAirplanes.push(new Airplane({lat: 30, lng: 40}, {lat: 30, lng: -120}, 38000));
        this.simulatedAirplanes.push(new Airplane({lat: 30, lng: 40}, {lat: 30, lng: -120}, 38000));
        this.simulatedAirplanes.push(new Airplane({lat: 30, lng: 40}, {lat: 30, lng: -120}, 38000));
        this.simulatedAirplanes.push(new Airplane({lat: 30, lng: 40}, {lat: 30, lng: -120}, 38000));
        this.simulatedAirplanes.push(new Airplane({lat: 30, lng: 40}, {lat: 30, lng: -120}, 38000));
        this.simulatedAirplanes.push(new Airplane({lat: 30, lng: 40}, {lat: 30, lng: -120}, 38000));

    }

    simTickSimulatedAirplanes() {
        this.simulatedAirplanes.forEach((airplane) => {
            airplane.simTick();

            this.mapService.airplaneAtLocation(airplane.currentPosition.lat, airplane.currentPosition.lng, airplane.currentAltitude);

        })
    }

    /*********************
     * Draw on map
     ********************/
    redrawAll() {
        this.drawGreatCircle();

        this.drawTurbulence();
        this.drawAirplane();
    }

    drawGreatCircle() {
        //clear layer
        if (this.greatCircleLayer) {
            this.map.removeLayer(this.greatCircleLayer);
            this.greatCircleLayer = null;
        }

        const zoomLevel = this.map.getZoom();
        let radius = zoomLevel >= 6 ? 8000 : 8000 * Math.pow(2, (6 - zoomLevel));
        let lineSize = zoomLevel >= 6 ? 4000 : 4000 * Math.pow(2, (6 - zoomLevel));


        this.greatCircleLayer = L.d3SvgOverlay((sel, proj) => {
            let lines = sel.selectAll('path').data([1]);
            this.routePoints.forEach((element, index, array) => {
                if (index + 1 < array.length) {
                    const greatCircleArray = this.geoHelperService.bigCircleBetweenPoints(array[index], array[index + 1]);
                    const line = d3.line()
                        .x(function (d) {
                            return proj.latLngToLayerPoint(d).x;
                        })
                        .y(function (d) {
                            return proj.latLngToLayerPoint(d).y;
                        });

                    lines.enter().append('path')
                        .attr("d", line(greatCircleArray))
                        .attr("stroke", this.isEditMode ? 'Red' : 'purple ')
                        .attr("stroke-width", proj.unitsPerMeter * lineSize)
                        .attr("fill", "none");
                }
            });

            //draw circles around wp
            const circles = sel.selectAll('circle').data(this.routePoints);
            circles.enter()
                .append('circle')
                .attr('r', (d) => {
                    const rInMeters = radius;
                    let latRef = 33; //the lat in which the radius is calculated
                    const rInPixels = rInMeters / (40075016.686 * Math.abs(Math.cos(latRef / 180 * Math.PI)) / Math.pow(2, this.map.getZoom() + 8));
                    return rInPixels;
                })
                .attr('cx', (d) => {
                    const latLng = d;
                    return proj.latLngToLayerPoint(latLng).x;
                })
                .attr('cy', (d) => {
                    const latLng = d;
                    return proj.latLngToLayerPoint(latLng).y;
                })
                .attr('fill', (d) => {
                    return this.isEditMode ? 'DarkRed' : 'DarkBlue ';
                });
        });

        this.greatCircleLayer.addTo(this.map);
    }

    drawAirplane() {
        //clear layer
        if (this.airplaneLayer) {
            this.map.removeLayer(this.airplaneLayer);
            this.airplaneLayer = null;
        }

        var zoomLevel = this.map.getZoom();
        var size = 70000;
        switch (zoomLevel) {
            case 7:
                size = 70000;
                break;
            case 6:
                size = 70000;
                break;
            case 5:
                size = 140000;
                break;
            case 4:
                size = 280000;
                break;
            case 3:
                size = 560000;
                break;
            case 2:
                size = 1120000;
                break;
            case 1:
                size = 2240000;
                break;
        }

        //resize
        size = size / 1.2;

        this.airplaneLayer = L.d3SvgOverlay((sel, proj) => {
            if (!this.airplane) return;


            //alert zone border
            var locations = [];
            var currentLocation = {lat: this.airplane.currentPosition.lat, lng: this.airplane.currentPosition.lng}
            locations.push(currentLocation);
            for (var az = -this.kAlertAngle; az <= this.kAlertAngle; az += 5) {
                var currentCalcCourse = this.airplane.currentAzimuth + az;
                //correct to 0-359
                if (currentCalcCourse >= 360) currentCalcCourse -= 360;
                if (currentCalcCourse <= 0) currentCalcCourse = 360 + currentCalcCourse;
                var coord = this.geoHelperService.newLocationFromPointWithDistanceBearing(currentLocation, this.kAlertRange, currentCalcCourse);
                locations.push(coord);

            }
            locations.push(currentLocation);
            var lines = sel.selectAll('path').data([1]);
            var line = d3.line()
                .x(function (d) {
                    return proj.latLngToLayerPoint(d).x;
                })
                .y(function (d) {
                    return proj.latLngToLayerPoint(d).y;
                });

            lines.enter().append('path')
                .attr("d", line(locations))
                .attr("stroke", "steelblue")
                .attr("stroke-width", proj.unitsPerMeter * 5000)
                .attr("fill", "none");

            var lines = sel.selectAll('airplane').data([{
                location: {
                    lat: this.airplane.currentPosition.lat,
                    lng: this.airplane.currentPosition.lng
                }, azimuth: this.airplane.currentAzimuth
            }]);
            // draw airplae icon
            lines.enter().append("image")
                .attr("width", proj.unitsPerMeter * size)
                .attr("height", proj.unitsPerMeter * size)
                .attr("transform", (d) => {
                    return 'translate (-' + proj.unitsPerMeter * size / 2 + ',-' + proj.unitsPerMeter * size / 2 + ') rotate(' + d.azimuth + ',' + (proj.latLngToLayerPoint(d.location).x + proj.unitsPerMeter * size / 2) + ',' + (proj.latLngToLayerPoint(d.location).y + proj.unitsPerMeter * size / 2) + ')'

                })
                .attr("xlink:href", "assets/airplane.svg")
                .attr("x", (d) => {
                    return proj.latLngToLayerPoint(d.location).x;
                })
                .attr("y", (d) => {
                    return proj.latLngToLayerPoint(d.location).y;
                })


        });

        this.airplaneLayer.addTo(this.map);
    }

    //draw myTurbulence
    drawTurbulence() {
        if (this.turbulenceLayer) {
            this.map.removeLayer(this.turbulenceLayer);
        }

        //clear layer
        this.turbulenceLayer = null;

        //don't draw when updating the route
        if (this.isEditMode) {
            return;
        }


        this.turbulenceLayer = L.d3SvgOverlay((sel, proj) => {
            const tiles = sel.selectAll('circle').data(this.turbulenceAtAlt);
            tiles.enter()
                .append('circle')
                .attr('r', (d) => {
                    var rInMeters = (this.geoHelperService.dist(this.geoHelperService.tile2lat(d.tileY, 11), this.geoHelperService.tile2long(d.tileX, 11), this.geoHelperService.tile2lat(d.tileY + 1, 11), this.geoHelperService.tile2long(d.tileX, 11)) / 2);
                    //convert to pixels: http://wiki.openstreetmap.org/wiki/Zoom_levels
                    var rInPixels = rInMeters / (40075016.686 * Math.abs(Math.cos(this.geoHelperService.tile2lat(d.tileY, 11) / 180 * Math.PI)) / Math.pow(2, this.map.getZoom() + 8));
                    return rInPixels;
                })
                .attr('cx', (d) => {
                    var latLng = [this.geoHelperService.tile2lat(d.tileY + 0.5, 11), this.geoHelperService.tile2long(d.tileX + 0.5, 11)];
                    return proj.latLngToLayerPoint(latLng).x;
                })
                .attr('cy', (d) => {
                    var latLng = [this.geoHelperService.tile2lat(d.tileY + 0.5, 11), this.geoHelperService.tile2long(d.tileX + 0.5, 11)];
                    return proj.latLngToLayerPoint(latLng).y;
                })
                //.attr('stroke', (d) => {
                //  return this.geoHelperService.getColorBySeverity(d.sev);
                //})
                //.attr('stroke-width',(d) => {
                //  var rInPixels = 5000 / (40075016.686 * Math.abs(Math.cos(this.geoHelperService.tile2lat(d.tileY, 11) / 180 * Math.PI)) / Math.pow(2, this.map.getZoom() + 8));
                //
                //  return rInPixels;
                //
                //})
                .attr('opacity', (d) => {

                    return d.sev == 0 ? 1.0 : 1.0;
                })
                .attr('fill', (d) => {
                    return this.geoHelperService.getColorBySeverity(d.severity, this.isDayLayer);
                });
        });
        this.turbulenceLayer.addTo(this.map);

    }

    /***************************
     altitude selection
     ***************************/
    altitude_clicked(e) {
        this.selectedAltitude = e;
        this.isFollowAlt = false;
        this.redrawAll();
    }

    autoAlt_changed(e) {
        this.isAutoAlt = e;

    }


    /***************************
     sim tick
     ***************************/

    simTick() {
        //move the airplane
        this.airplane.simTick();
        this.simTickSimulatedAirplanes();
        this.mapService.airplaneAtLocation(this.airplane.currentPosition.lat, this.airplane.currentPosition.lng, this.airplane.currentAltitude);
        this.turbulenceAtAlt = this.mapService.getTurbulenceByAlt(this.selectedAltitude);
        //change current altitude if auto alt is on
        if (this.isAutoAlt && this.isFollowAlt) {
            this.selectedAltitude = this.airplane.currentAltitudeLevel()
        }

        let arrTurbelenceBelow: Array<Tile> = this.selectedAltitude > 0 ? this.mapService.getTurbulenceByAlt(this.selectedAltitude - 1) : [];
        let arrTurbelenceAbove: Array<Tile> = this.selectedAltitude < 4 ? this.mapService.getTurbulenceByAlt(this.selectedAltitude + 1) : [];
        let am = AlertManager.getAlertLevel(arrTurbelenceBelow, this.turbulenceAtAlt, arrTurbelenceAbove, this.airplane);

        this.isAlertBoxShow=am.isAlert; this.topAlertColor = am.above ; this.bottomAlertColor = am.below; this.currentAlertColor = am.at;

        this.redrawAll();

    }
}

