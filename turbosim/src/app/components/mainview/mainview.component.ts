import {Component, OnInit, ViewChild, OnDestroy} from '@angular/core';
import {MapService, Tile} from '../../services/map.service';
import {AirportPickerComponent} from '../airport-picker/airport-picker.component';
// import {ToggleComponent} from '../toggle/toggle.component';
import {GeoHelperService} from '../../services/geo-helper.service';
import {Airport} from "../../classes/airport";
import {SimulatorService} from '../../services/simulator.service';
import {Airplane} from "../../classes/airplane";
import {Observable} from "rxjs";
import {Router} from '@angular/router';

import 'leaflet';
import * as d3 from 'd3';
import 'leaflet-d3-svg-overlay';
import {AlertManager} from "../../classes/alert-manager";
import {Scenario, SimRoute} from "../../classes/simroute";
import {ScenarioService} from "../../services/scenario.service";
import {SimroutesService} from "../../services/simroutes.service";
import {AboutComponent} from "../about/about.component";
import {AirportService} from "../../services/airport.service";
import {AuthService} from "../../services/auth.service";
import {HelpComponent} from "../help/help.component";
import {AlertComponent} from "../alert/alert.component";
import {Cloud, CrossWind, Freeze, Lightning} from '../../classes/weatherInfo'
import {WeatherReportComponent} from "../weather-report/weather-report.component";
@Component({
    selector: 'app-mainview',
    templateUrl: './mainview.component.html',
    styleUrls: ['./mainview.component.css']
})


export class MainviewComponent implements OnInit, OnDestroy {

    map: any; //the leaflet map object
    isEditRouteMode: boolean; //flag route edit mode
    @ViewChild(AirportPickerComponent) public readonly modal: AirportPickerComponent;
    @ViewChild(AboutComponent) public readonly about: AboutComponent;
    @ViewChild('cloudAlert') public readonly cloudAlert: AlertComponent;
    @ViewChild('lightningAlert') public readonly lightningAlert: AlertComponent;
    @ViewChild('freezeAlert') public readonly freezeAlert: WeatherReportComponent;
    @ViewChild('windAlert') public readonly windAlert: WeatherReportComponent;
    @ViewChild(HelpComponent) public readonly help: HelpComponent;
    whichAirport: string; // which airport button was clicked
    toAirport: Airport;
    landAirport: Airport;

    routePoints: Array<{ lat: number, lng: number }>;

    //layers
    greatCircleLayer: L.Layer;
    airplaneLayer: L.Layer;
    turbulenceLayer: L.Layer;
    turbulenceLayer_temp: L.Layer;
    cloudInfoLayer: L.Layer;
    lightningLayer: L.Layer;
    freezeLayer: L.Layer;
    windLayer: L.Layer;
    isEditMode: boolean = false;

    simSpeed: number;

    airplane: Airplane;
    turbulenceAtAlt: Tile [] = [];
    turbulenceAtAlt_temp: Tile [] = [];
    isDayLayer: boolean = true;

    selectedAltitude: number = 1;
    isAutoAlt: boolean = false; //when auto alt is selected
    isFollowAlt: boolean = true; //should the display follow to altitude of the airplane when in auto alt mode
    isAbove30: boolean = false; //we start below 30000

    observerHook: any;
    simulatedAirplanes: Array<Airplane>;

    //alert
    isAlertBoxShow: boolean = false;
    bottomAlertColor: string;
    currentAlertColor: string;
    topAlertColor: string;
    kAlertAngle: number = 15;
    kAlertRange: number = 100;
    alertLevel: number = 2;
    showAlert: boolean = true;
    //alert sound
    audio: HTMLAudioElement;
    isAlertResetMode: boolean; //if the user muted alert


    //scenario
    arrScenarios: Array<Scenario> = [];
    selectedScenario: Scenario = null;
    observeScenarioService: Observable<any>;

    //sim routes
    arrsimroutes: Array<SimRoute> = [];
    observeSimroutesService: Observable<any>;

    //redraw
    isNeedRedraw: boolean = true;
    isAllowDraw: boolean = true;

    //sim control
    simData: { isPause: boolean } = {isPause: true};

    // Weather info
    cloudInfo: Map<string, Cloud> = new Map();
    lightningInfo: Map<string, Lightning> = new Map();
    freezeInfo: Map<string, Freeze> = new Map();
    windInfo: Map<string, CrossWind> = new Map();


    /***********************
     *  constractor
     **********************/
    constructor(private mapService: MapService,
                private  geoHelperService: GeoHelperService,
                private simulatorService: SimulatorService,
                private scenarioService: ScenarioService,
                private simroutesService: SimroutesService,
                private airportService: AirportService,
                private router: Router,
                public authService: AuthService) {

        this.isEditRouteMode = false;
        //layers
        this.greatCircleLayer = null;
    }

    /***********************
     *  onInit
     **********************/
    ngOnInit() {
        this.simData = this.simulatorService.simdata;

        //init audio
        this.audio = new Audio();
        this.audio.src = "../../assets/sound/sound.wav";
        this.audio.load();

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
        this.initScenarioaObserver();
        this.initRoute();
        this.initSsimulatedAirplanes();
        this.initSimulator();
        this.initWeatherInfo();


    }

    ngOnDestroy() {
        this.observerHook.unsubscribe();
    }

    /***************************
     init simulator
     ***************************/
    initSimulator() {
        this.simSpeed = 5;
        this.simulatorService.setTimeTickSpeed(5);
        this.observerHook = this.simulatorService.getSimTicker().subscribe((item) => {
            this.simTick();
        });
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
        const osmAttrib = 'Map data © <a href="https://openstreetmap.org">OpenStreetMap</a> contributors';
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
            this.isAllowDraw = true;
            this.isNeedRedraw = true;
            this.redrawAll();
        });

        this.map.on('zoomstart', () => {
            this.isAllowDraw = false;
            this.map.eachLayer((item) => {
                if (!item._url) this.map.removeLayer(item);
            })
        })
    }

    /***************************
     init Scenario Observer
     ***************************/
    initScenarioaObserver() {
        this.observeScenarioService = this.scenarioService.getScenarios();
        let airports$ = this.airportService.getAirports();
        airports$.subscribe(null, null, () => {
            this.observeScenarioService.subscribe((item: Scenario) => {
                    this.arrScenarios.push(item);
                }, () => {
                },
                () => { //completion
                    if (this.arrScenarios) {
                        this.selectedScenario = this.arrScenarios[0];
                    }
                    this.scenarioChanged();
                });
        })
    }

    scenarioChanged() {
        this.toAirport = this.airportService.getAirportByICAO(this.selectedScenario.toAirport);
        this.landAirport = this.airportService.getAirportByICAO(this.selectedScenario.landAirport);
        this.mapService.setScenario(this.selectedScenario._id, () => {
            this.initSimRoutesObserver();
            this.initRoute();
        });


    }

    /***************************
     init SimRoutes Observer
     ***************************/
    initSimRoutesObserver() {
        this.arrsimroutes = [];
        this.observeSimroutesService = this.simroutesService.getSimroutes(this.selectedScenario._id);
        this.observeSimroutesService.subscribe((item: SimRoute) => {

                if (item.isRealtime) {
                    this.arrsimroutes.push(item);
                } else {
                    let airplane = new Airplane({
                        lat: item.toAirport.latitude,
                        lng: item.toAirport.longitude
                    }, {lat: item.landAirport.latitude, lng: item.landAirport.longitude}, item.altitude);
                    while (!airplane.isLanded) {
                        airplane.move();
                        this.mapService.airplaneAtLocation(airplane.currentPosition.lat, airplane.currentPosition.lng, airplane.currentAltitude);
                    }
                }

            }, () => {
            },
            () => { //completion
                this.mapService.resetTurbulence_temp(); //clear the temp turbulence
                this.initSsimulatedAirplanes();

                //init display
                this.turbulenceAtAlt = this.mapService.getTurbulenceByAlt(this.selectedAltitude);
                this.isNeedRedraw = true;
                this.redrawAll();


            });

    }

    /*********************
     init weather info
     *********************/
    initWeatherInfo() {
        this.mapService.getCloudInfo().subscribe(cloudMap => {
            this.cloudInfo = cloudMap;
        });
        this.mapService.getLightningInfo().subscribe(lightningMap => {
            this.lightningInfo = lightningMap;
        });
        this.mapService.getFreezeInfo().subscribe(freezeMap => {
            this.freezeInfo = freezeMap;
        });
        this.mapService.getCrossWindInfo().subscribe(windMap => {
            this.windInfo = windMap;
        })

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
        this.isNeedRedraw = true;

    }

    /*********************
     restart
     *********************/
    restart() {
        this.initRoute();
        this.isNeedRedraw = true;
    }

    /***********************
     *  about clicked
     **********************/
    aboutClicked(e) {
        this.about.show(e.clientX - 250, e.clientY + 20);
    }

    /*********************
     alerrts
     *********************/
    alertClicked(alert: string,e) {
        switch (alert) {
            case ('cloud'):
                this.cloudAlert.show(0, window.innerHeight - 500);
                break;
            case ('lightning'):
                this.lightningAlert.show(0, window.innerHeight - 500);
                break;
            case ('freeze'):
                this.freezeAlert.show(e.clientX +20, e.clientY );
                break;
            case ('wind'):
                this.windAlert.show(e.clientX +20, e.clientY );
                break;
        }

    }

    /*********************
     * help clicked
     *********************/
    helpClicked(e) {
        this.help.show();
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
        this.centerMap();
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

    simPause() {
        this.simulatorService.toggleSimulatorPause();
        // this.simulatorService.setNumber(222);
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
        this.arrsimroutes.forEach((item) => {
            this.simulatedAirplanes.push(new Airplane({
                lat: item.toAirport.latitude,
                lng: item.toAirport.longitude
            }, {lat: item.landAirport.latitude, lng: item.landAirport.longitude}, item.altitude));
        })


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
        if (!this.isAllowDraw) return;
        if (this.isNeedRedraw) {
            this.drawTurbulence();
            this.isNeedRedraw = false;
            this.mapService.resetTurbulence_temp();
        } else {
            this.drawTurbulence_temp();
        }
        this.drawGreatCircle();

        this.drawAirplane();

        this.drawCloud();
        this.drawLightning();
        this.drawFreeze();
        this.drawWind();


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

        let zoomLevel = this.map.getZoom();
        let size = 70000;
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
            let locations = [];
            let currentLocation = {lat: this.airplane.currentPosition.lat, lng: this.airplane.currentPosition.lng}
            locations.push(currentLocation);
            for (let az = -this.kAlertAngle; az <= this.kAlertAngle; az += 5) {
                let currentCalcCourse = this.airplane.currentAzimuth + az;
                //correct to 0-359
                if (currentCalcCourse >= 360) currentCalcCourse -= 360;
                if (currentCalcCourse <= 0) currentCalcCourse = 360 + currentCalcCourse;
                let coord = this.geoHelperService.newLocationFromPointWithDistanceBearing(currentLocation, this.kAlertRange, currentCalcCourse);
                locations.push(coord);

            }
            locations.push(currentLocation);
            let lines = sel.selectAll('path').data([1]);
            let line = d3.line()
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

            lines = sel.selectAll('airplane').data([{
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
                // .attr("xlink:href", "/assets/airplane@2x.png")
                .attr("xlink:xlink:href", 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iaXNvLTg4NTktMSI/Pgo8IURPQ1RZUEUgc3ZnIFBVQkxJQyAiLS8vVzNDLy9EVEQgU1ZHIDEuMS8vRU4iICJodHRwOi8vd3d3LnczLm9yZy9HcmFwaGljcy9TVkcvMS4xL0RURC9zdmcxMS5kdGQiPgo8c3ZnIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHZlcnNpb249IjEuMSIgaWQ9IkNhcGFfMSIgeD0iMHB4IiB5PSIwcHgiIHdpZHRoPSI1MTJweCIgaGVpZ2h0PSI1MTJweCIgdmlld0JveD0iMCAwIDUxMCA1MTAiIHN0eWxlPSJlbmFibGUtYmFja2dyb3VuZDpuZXcgMCAwIDUxMCA1MTA7IiB4bWw6c3BhY2U9InByZXNlcnZlIj4KPGc+Cgk8ZyBpZD0iYWlycGxhbmVtb2RlLW9uIj4KCQk8cGF0aCBkPSJNNDk3LjI1LDM1N3YtNTFsLTIwNC0xMjcuNVYzOC4yNUMyOTMuMjUsMTcuODUsMjc1LjQsMCwyNTUsMGMtMjAuNCwwLTM4LjI1LDE3Ljg1LTM4LjI1LDM4LjI1VjE3OC41TDEyLjc1LDMwNnY1MSAgICBsMjA0LTYzLjc1VjQzMy41bC01MSwzOC4yNVY1MTBMMjU1LDQ4NC41bDg5LjI1LDI1LjV2LTM4LjI1bC01MS0zOC4yNVYyOTMuMjVMNDk3LjI1LDM1N3oiIGZpbGw9IiMxMTFjOTkiLz4KCTwvZz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8L3N2Zz4K')
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
                    let rInMeters = (this.geoHelperService.dist(this.geoHelperService.tile2lat(d.tileY, 11), this.geoHelperService.tile2long(d.tileX, 11), this.geoHelperService.tile2lat(d.tileY + 1, 11), this.geoHelperService.tile2long(d.tileX, 11)) / 2);
                    //convert to pixels: http://wiki.openstreetmap.org/wiki/Zoom_levels
                    let rInPixels = rInMeters / (40075016.686 * Math.abs(Math.cos(this.geoHelperService.tile2lat(d.tileY, 11) / 180 * Math.PI)) / Math.pow(2, this.map.getZoom() + 8));
                    return rInPixels;
                })
                .attr('cx', (d) => {
                    let latLng = [this.geoHelperService.tile2lat(d.tileY + 0.5, 11), this.geoHelperService.tile2long(d.tileX + 0.5, 11)];
                    return proj.latLngToLayerPoint(latLng).x;
                })
                .attr('cy', (d) => {
                    let latLng = [this.geoHelperService.tile2lat(d.tileY + 0.5, 11), this.geoHelperService.tile2long(d.tileX + 0.5, 11)];
                    return proj.latLngToLayerPoint(latLng).y;
                })
                .attr('opacity', (d) => {

                    return d.sev == 0 ? 1.0 : 1.0;
                })
                .attr('fill', (d) => {
                    return this.geoHelperService.getColorBySeverity(d.severity, this.isDayLayer);
                });
        });
        this.turbulenceLayer.addTo(this.map);

    }

    //draw myTurbulence for new turbulence
    drawTurbulence_temp() {
        if (this.turbulenceLayer_temp) {
            this.map.removeLayer(this.turbulenceLayer_temp);
        }

        //clear layer
        this.turbulenceLayer_temp = null;

        //don't draw when updating the route
        if (this.isEditMode) {
            return;
        }
        this.turbulenceLayer_temp = L.d3SvgOverlay((sel, proj) => {
            const tiles = sel.selectAll('circle').data(this.turbulenceAtAlt_temp);
            tiles.enter()
                .append('circle')
                .attr('r', (d) => {
                    let rInMeters = (this.geoHelperService.dist(this.geoHelperService.tile2lat(d.tileY, 11), this.geoHelperService.tile2long(d.tileX, 11), this.geoHelperService.tile2lat(d.tileY + 1, 11), this.geoHelperService.tile2long(d.tileX, 11)) / 2);
                    //convert to pixels: http://wiki.openstreetmap.org/wiki/Zoom_levels
                    let rInPixels = rInMeters / (40075016.686 * Math.abs(Math.cos(this.geoHelperService.tile2lat(d.tileY, 11) / 180 * Math.PI)) / Math.pow(2, this.map.getZoom() + 8));
                    return rInPixels;
                })
                .attr('cx', (d) => {
                    let latLng = [this.geoHelperService.tile2lat(d.tileY + 0.5, 11), this.geoHelperService.tile2long(d.tileX + 0.5, 11)];
                    return proj.latLngToLayerPoint(latLng).x;
                })
                .attr('cy', (d) => {
                    let latLng = [this.geoHelperService.tile2lat(d.tileY + 0.5, 11), this.geoHelperService.tile2long(d.tileX + 0.5, 11)];
                    return proj.latLngToLayerPoint(latLng).y;
                })
                .attr('opacity', (d) => {

                    return d.sev == 0 ? 1.0 : 1.0;
                })
                .attr('fill', (d) => {
                    return this.geoHelperService.getColorBySeverity(d.severity, this.isDayLayer);
                });
        });
        this.turbulenceLayer_temp.addTo(this.map);

    }

    alertLevelSelected(alertLevel) {
        this.alertLevel = alertLevel;
    }

    alertShowChanged(showAlert) {
        this.showAlert = showAlert;
        if (!showAlert) this.isAlertBoxShow = false; //hide alert box if needed
    }

    //weather info
    drawCloud() {

        if (this.cloudInfoLayer) {
            this.map.removeLayer(this.cloudInfoLayer);
        }

        //clear layer
        this.cloudInfoLayer = null;

        //don't draw when updating the route
        if (this.isEditMode) {
            return;
        }
        let arr = [];
        this.cloudInfo.forEach((value: Cloud, key: string) => {
            //only show clouds that their tops is above selected visible height
            if (value.height>=(this.selectedAltitude * 2 +30)) arr.push(value);
        });

        let size = 25000;
        this.cloudInfoLayer = L.d3SvgOverlay((sel, proj) => {
            let lines = sel.selectAll('path').data(arr);
            lines.enter().append("image")
                .attr("width", proj.unitsPerMeter * size)
                .attr("height", proj.unitsPerMeter * size)
                .attr("transform", (d) => {
                    return 'translate (-' + proj.unitsPerMeter * size / 2 + ',-' + proj.unitsPerMeter * size / 2 + ')'
                })
                .attr("xlink:xlink:href", 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAMAAAD04JH5AAACKFBMVEX///8epsYepsYepsYepsYepsYepsYepsYepsYepsYepsYepsYepsYepsYepsYepsYepsYepsYepsYepsYepsYepsYepsYepsYepsYepsYepsYepsYepsYepsYepsYepsYepsYepsYepsYepsYepsYepsYepsYepsYepsYepsYepsYepsYepsYepsYepsYepsYepsYepsYepsYepsYepsYepsYepsYepsYepsYepsYepsYepsYepsYepsYepsYepsYepsYepsYepsYepsYepsYepsYepsYepsYepsYepsYepsYepsYepsYepsYepsYepsYepsYepsYepsYepsYepsYepsYepsYepsYepsYepsYepsYepsYepsYepsYepsYepsYepsYepsYepsYepsYepsYepsYepsYepsYepsYepsYepsYepsYepsYepsYepsYepsYepsYepsYepsYepsYepsYepsYepsYepsYepsYepsYepsYepsYepsYepsYepsYepsYepsYepsYepsYepsYepsYepsYepsYepsYepsYepsYepsYepsYepsYepsYepsYepsYepsYepsYepsYepsYepsYepsYepsYepsYepsYepsYepsYepsYepsYepsYepsYepsYepsYepsYepsYepsYepsYepsYepsYepsYepsYepsYepsYepsYepsYepsYepsYepsYepsYepsYepsYepsYepsYepsYepsYepsajBY/UAAAAt3RSTlMAAQIDBAUGBwgJCwwODxATFBUWFxgZGhscHR8gISIjJSYnKCkrLC4vMDEzNDU2Nzg5Ojs8PT9AQkVGR0lKTU5QUVNVXV9hYmNkZWZrbW5wcXJ0dXh5e31+f4CCg4SGh4iKjZCRkpSVlpeZmpudnqGio6Slp6mqq6ytr7CztLW3ubq9vr/AwcLDxMbHyMnKy83Oz9DS09TX2Nnc3d7f4eLj5OXn6Onq6+zu7/Dy8/X29/j5+vv8/f67qurEAAACwElEQVR42u3X9zuVcRgG8NtoGS20tQsVDVE0pV3am0p7LxHtoaI9NLWlouPgcJz730uHy8jB+759xy/fz59wX89zX88DwzAMwzAMw3Aisj80mbDxUEFpeS3pev/gyoGF4VApKHHvG3bWcH9HAhQZlPuVARUvgAIDtv1mt8oyQyFXyOpv7NGLqZBpXBl749kuMYT5VbTg6URIkuWlJdVJkKHPKVpVkyJj9y/Rutp0CLeLdnjmQbAMH22pjIFQ8W7aVBwitH0/0bZsCHSI9jWlQpixDXTgCYTJpyOLIUginXkZBDHu0aFlECKOTj2CEDvplG8ERHhGx7LQImRUypJZo/rBkZF07i6AIVvvfGyk3+fj6X1h2zo65x2SnOdhR67jMbDpJv9DJbtw50TAlgqKVjEHNoQ0UTjPClg3jDLkwrJplGIDrFpEKbzpsGgt5aiOtXiMH6YkhehdWMaFakqThF4MP1ZHme6hR1EH6yjZDPRgvZvS5aBbkYVU4FX35VNOJcYisLl24xd8Mya6qEgWAomvoir7Aq5fJZU5iwCuUp0idLWKCr2agn+NdlEl3/VkdHaRqp0ZiA7GeKnct/lod4Qa1KcBrQbXUofaFLTaRD1qZqLFDWpSnYC/+rqpy89oNEulPufQLJsazfG3kEalAG5TpzigjDqdAL5Tp5o+aKBWSZoT4GY8p1ZFuEatnuAktfqA3dSqBkuplRthddTpPTRPYQmwmjoVAFE+apTrv8k0mgcgQWMEVaFolkdtzre8Rh7qsgR+B6nJi2D4hZdRj7S2B/0HdbiFNskequeejHYrqJxvGTpa00DF9qCzlF9UKj8I/4h9TYX2B6OLiFNeKlKfiYAmXaESD6ejO7NLKN27DPRk/JbSJspTd215KHozdOXRy4+/NFIw19vi0xnhsCx4cLRQYTAMwzAMwzCMQP4AUVp9kBafUmMAAAAASUVORK5CYII=')
                .attr("x", (d) => {
                    let latLng = [this.geoHelperService.tile2lat(d.tileY + 0.5, 11), this.geoHelperService.tile2long(d.tileX + 0.5, 11)];
                    return proj.latLngToLayerPoint(latLng).x;
                })
                .attr("y", (d) => {
                    let latLng = [this.geoHelperService.tile2lat(d.tileY + 0.5, 11), this.geoHelperService.tile2long(d.tileX + 0.5, 11)];
                    return proj.latLngToLayerPoint(latLng).y;
                })
        })
        this.cloudInfoLayer.addTo(this.map);
    }

    drawLightning() {

        if (this.lightningLayer) {
            this.map.removeLayer(this.lightningLayer);
        }

        //clear layer
        this.lightningLayer = null;

        //don't draw when updating the route
        if (this.isEditMode) {
            return;
        }
        let arr = [];
        this.lightningInfo.forEach((value: Lightning, key: string) => {
            if (value.height>=(this.selectedAltitude * 2 +30)) arr.push(value);
        });

        let size = 35000;
        this.lightningLayer = L.d3SvgOverlay((sel, proj) => {
            let lines = sel.selectAll('path').data(arr);
            lines.enter().append("image")
                .attr("width", proj.unitsPerMeter * size)
                .attr("height", proj.unitsPerMeter * size)
                .attr("transform", (d) => {
                    return 'translate (-' + proj.unitsPerMeter * size / 2 + ',-' + proj.unitsPerMeter * size / 2 + ')'
                })
                .attr("xlink:xlink:href", 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAMAAAD04JH5AAAByFBMVEX////suhbsuhbsuhbsuhbsuhbsuhbsuhbsuhbsuhbsuhbsuhbsuhbsuhbsuhbsuhbsuhbsuhbsuhbsuhbsuhbsuhbsuhbsuhbsuhbsuhbsuhbsuhbsuhbsuhbsuhbsuhbsuhbsuhbsuhbsuhbsuhbsuhbsuhbsuhbsuhbsuhbsuhbsuhbsuhbsuhbsuhbsuhbsuhbsuhbsuhbsuhbsuhbsuhbsuhbsuhbsuhbsuhbsuhbsuhbsuhbsuhbsuhbsuhbsuhbsuhbsuhbsuhbsuhbsuhbsuhbsuhbsuhbsuhbsuhbsuhbsuhbsuhbsuhbsuhbsuhbsuhbsuhbsuhbsuhbsuhbsuhbsuhbsuhbsuhbsuhbsuhbsuhbsuhbsuhbsuhbsuhbsuhbsuhbsuhbsuhbsuhbsuhbsuhbsuhbsuhbsuhbsuhbsuhbsuhbsuhbsuhbsuhbsuhbsuhbsuhbsuhbsuhbsuhbsuhbsuhbsuhbsuhbsuhbsuhbsuhbsuhbsuhbsuhbsuhbsuhbsuhbsuhbsuhbsuhbsuhbsuhbsuhbsuhbsuhbsuhbsuhbsuhbsuhbsuhbsuhbsuhbsuhbsuhbsuhbsuhbsuhZxdV7VAAAAl3RSTlMAAQIDBQYHCAkKCwwODxAREhMUGhscHiAhIiUmJygpKiwuMTIzODw9Pj9AQkNFRkdMTU9RUlNUV1laXF1eX2dpamtsb3J0dXZ3eHl6gYOEhoeKjJCRkpOUmZyen6ChoqmrrK2usbS3uLm6u8LDxMXGx8jKzM3R09TV1tfZ293e3+Dj5OXm5+jp6uvw8fLz9PX29/n6+/z+BHwIVAAAAqBJREFUeAHF2/lXjHEUx/FPk8HURGYKWQwVkX2XfVFZkkWWJDtlySJLlpJFNROG0Tzff9fBudJzNPecMff5vP6E90+fH+7FfznkVD1FsFOadJpMAjrLAC3gBng5lRvAqyMHOA9ugA8zyAG2kAPcgKUSNcCnSnKA/eQAD0PcAN8XkwO0ghvg1TRuAK+eHKAd3ABDM2Gq2Sm2kgPcBDfA59nkAAfIAR6HjAOMuJzGlpADnAA3wOvp5ACryAE6wA0wUk4O0EAOcAvcAF/mkAMcJAfoLYaxJpdLtpoc4CS4Afoj5ACryQEugRsgGSMH2EEOcBvcAOkqcoAmcgD3djCHnqhxAEW6xjiAwtsIboDD4Aa4iEKI5B3gbhiF0Ojy1B8rTIBhl5/UIlADZNeAG2AfuAHOghugq5gboC/KDZCcC2qAzDJwA+wEN8BxcANcK+IG6I1wA7yLgxpAJhgrgLcJhRNdOpk24wmmemo7wVTL3STuhRGIy7YTTBUfs51gqhbbCaaa8tF2gqm22U4w3X3bCaaq/vcEK0NQ2m0nmKr8q+kE0zXaTjBVaMB0gunW2U4wXZfpBNPN85zf+zgCdNp0gulKUqYTTLfb+R1BoJ45n04EagVrgokrpAkmKnxTLJVAsI75JthaBCs8RJpgosFNcA5Be0CaYKLG/e1FGYJ2YcIEq0LQZn0jTTDRTJpgIvSGNMHEetYEE93ujycRBG++Nz7BKkDQ5kS6FgSlo6QJJvawJph4Tppgop41wcRV99tADBSVWffLaAIcraQJJsLD8jRCsp01wcQj91N3MUhqWRNMdPgmGGWKZerAIf8ku0ATGpSDdZINzrnrReC5Q5pgYqFHmmDiDGmCjU8xbzOY9rqjoOrrBNVK1gQTp2Kgii6AuR8/DvqWjUjk7AAAAABJRU5ErkJggg==')
                .attr("x", (d) => {
                    let latLng = [this.geoHelperService.tile2lat(d.tileY + 0.5, 11), this.geoHelperService.tile2long(d.tileX + 0.5, 11)];
                    return proj.latLngToLayerPoint(latLng).x;
                })
                .attr("y", (d) => {
                    let latLng = [this.geoHelperService.tile2lat(d.tileY + 0.5, 11), this.geoHelperService.tile2long(d.tileX + 0.5, 11)];
                    return proj.latLngToLayerPoint(latLng).y;
                })
        })
        this.lightningLayer.addTo(this.map);
    }
    drawFreeze() {

        if (this.freezeLayer) {
            this.map.removeLayer(this.freezeLayer);
        }

        //clear layer
        this.freezeLayer = null;

        //don't draw when updating the route
        if (this.isEditMode) {
            return;
        }
        let arr = [];
        this.freezeInfo.forEach((value: Freeze, key: string) => {
            if (value.height /1000>=(this.selectedAltitude * 2 +30) &&  value.height/1000<(this.selectedAltitude * 2 +32)) arr.push(value);
        });

        let size = 35000;
        this.freezeLayer = L.d3SvgOverlay((sel, proj) => {
            let lines = sel.selectAll('path').data(arr);
            lines.enter().append("image")
                .attr("width", proj.unitsPerMeter * size)
                .attr("height", proj.unitsPerMeter * size)
                .attr("transform", (d) => {
                    return 'translate (-' + proj.unitsPerMeter * size / 2 + ',-' + proj.unitsPerMeter * size / 2 + ')'
                })
                .attr("xlink:xlink:href", 'data:image/png;base64,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')
                // .attr("xlink:xlink:href", 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAMAAAD04JH5AAACylBMVEUAAACTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsVXj5qDAAAA7XRSTlMABiM8Vm+ImYRqUDcdAg9aq/PomkkHBGC4+vKpSlLYwcaqJJ/hx7bM5/10GcjikkIWARtTo++iNeX2jjQFRaj+9/ydHDK7LTa/KtzgFRqUEr7CCMn7aZihSHxAaKDKk8R5tLKWdS9VvQPj5ozbJ1sL9fF7Zc8uIdNHhuuJ17m87l9m2mIe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')
                .attr("x", (d) => {
                    let latLng = [this.geoHelperService.tile2lat(d.tileY + 0.5, 11), this.geoHelperService.tile2long(d.tileX + 0.5, 11)];
                    return proj.latLngToLayerPoint(latLng).x;
                })
                .attr("y", (d) => {
                    let latLng = [this.geoHelperService.tile2lat(d.tileY + 0.5, 11), this.geoHelperService.tile2long(d.tileX + 0.5, 11)];
                    return proj.latLngToLayerPoint(latLng).y;
                })
        })
        this.freezeLayer.addTo(this.map);
    }
    drawWind() {

        if (this.windLayer) {
            this.map.removeLayer(this.windLayer);
        }

        //clear layer
        this.windLayer = null;

        //don't draw when updating the route
        if (this.isEditMode) {
            return;
        }
        let arr = [];
        this.windInfo.forEach((value: Freeze, key: string) => {
            if (value.height /1000>=(this.selectedAltitude * 2 +30) &&  value.height/1000<(this.selectedAltitude * 2 +32)) arr.push(value);
        });

        let size = 35000;
        this.windLayer = L.d3SvgOverlay((sel, proj) => {
            let lines = sel.selectAll('path').data(arr);
            lines.enter().append("image")
                .attr("width", proj.unitsPerMeter * size)
                .attr("height", proj.unitsPerMeter * size)
                .attr("transform", (d) => {
                    return 'translate (-' + proj.unitsPerMeter * size / 2 + ',-' + proj.unitsPerMeter * size / 2 + ')'
                })
                .attr("xlink:xlink:href", 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAMAAAD04JH5AAACylBMVEUAAACTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsWTPsVXj5qDAAAA7XRSTlMABiM8Vm+ImYRqUDcdAg9aq/PomkkHBGC4+vKpSlLYwcaqJJ/hx7bM5/10GcjikkIWARtTo++iNeX2jjQFRaj+9/ydHDK7LTa/KtzgFRqUEr7CCMn7aZihSHxAaKDKk8R5tLKWdS9VvQPj5ozbJ1sL9fF7Zc8uIdNHhuuJ17m87l9m2mIe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')
                .attr("x", (d) => {
                    let latLng = [this.geoHelperService.tile2lat(d.tileY + 0.5, 11), this.geoHelperService.tile2long(d.tileX + 0.5, 11)];
                    return proj.latLngToLayerPoint(latLng).x;
                })
                .attr("y", (d) => {
                    let latLng = [this.geoHelperService.tile2lat(d.tileY + 0.5, 11), this.geoHelperService.tile2long(d.tileX + 0.5, 11)];
                    return proj.latLngToLayerPoint(latLng).y;
                })
        })
        this.windLayer.addTo(this.map);
    }
    /***************************
     center map
     ***************************/
    centerMap() {
        this.map.panTo([this.airplane.currentPosition.lat, this.airplane.currentPosition.lng]);
    }

    /***************************
     altitude selection
     ***************************/
    altitude_clicked(e) {

        this.selectedAltitude = e;
        this.turbulenceAtAlt = this.mapService.getTurbulenceByAlt(this.selectedAltitude);
        this.isFollowAlt = false;
        this.isNeedRedraw = true;
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
        //change to auto alt above 30000
        if (this.airplane.currentAltitude >= 30000 && !this.isAbove30) {
            this.isAutoAlt = true;
            this.isAbove30 = true;


        }
        //move simulated airplanes
        this.simTickSimulatedAirplanes();
        // find if there is turbulence at airplane location
        this.mapService.airplaneAtLocation(this.airplane.currentPosition.lat, this.airplane.currentPosition.lng, this.airplane.currentAltitude);

        //get the turbulence at the current selected altitude
        this.turbulenceAtAlt = this.mapService.getTurbulenceByAlt(this.selectedAltitude);
        this.turbulenceAtAlt_temp = this.mapService.getTurbulenceByAlt_temp(this.selectedAltitude);

        //change current altitude if auto alt is on
        if (this.isAutoAlt && this.isFollowAlt) {
            if (this.selectedAltitude !== this.airplane.currentAltitudeLevel()) {
                this.isNeedRedraw = true;
                this.selectedAltitude = this.airplane.currentAltitudeLevel();
            }
        }

        // calculate alerts
        let airplaneAltitudeLevel = this.airplane.currentAltitudeLevel();
        if (airplaneAltitudeLevel >= 0 && this.showAlert) {
            let arrTurbelenceBelow: Map<string, Tile> = airplaneAltitudeLevel > 0 ? this.mapService.getTurbulenceMapByAlt(airplaneAltitudeLevel - 1) : new Map();
            let arrTurbelenceAt: Map<string, Tile> = this.mapService.getTurbulenceMapByAlt(airplaneAltitudeLevel);
            let arrTurbelenceAbove: Map<string, Tile> = airplaneAltitudeLevel < 4 ? this.mapService.getTurbulenceMapByAlt(airplaneAltitudeLevel + 1) : new Map();
            let am = AlertManager.getAlertLevel(arrTurbelenceBelow, arrTurbelenceAt, arrTurbelenceAbove, this.airplane, this.alertLevel);
            this.isAlertBoxShow = am.isAlert;
            this.topAlertColor = am.above;
            this.bottomAlertColor = am.below;
            this.currentAlertColor = am.at;
            if (am.isAlert && !this.isAlertResetMode) {
                this.audio.play();

            } else {
                this.audio.pause();

            }
            if (!am.isAlert) this.isAlertResetMode = false;
        }
        this.redrawAll();
    }

    //alert reset
    alertResetClicked() {
        if (!this.isAlertResetMode) {
            this.isAlertResetMode = true;
            this.audio.pause(); //stop sound
        }
    }

    /*********************
     admin operations
     *********************/
    gotoEditor() {
        this.router.navigate(['/planner']);
    }
}

