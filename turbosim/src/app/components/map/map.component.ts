import {Component, OnInit, ViewChild, Input, SimpleChanges, OnChanges} from '@angular/core';
import {MapService} from '../../services/map.service';
import {Observable} from "rxjs";
import {TurboArea} from "../../classes/turbo-area";
import 'leaflet';
import 'leaflet.pm';
import GeoJsonObject = GeoJSON.GeoJsonObject;
import GeoJSONOptions = L.GeoJSONOptions;
import {SimRoute} from "../../classes/simroute";
import {SimroutesService} from "../../services/simroutes.service";
import {GeoHelperService} from "../../services/geo-helper.service";


@Component({
    selector: 'app-map',
    templateUrl: './map.component.html',
    styleUrls: ['./map.component.css']
})
export class MapComponent implements OnInit, OnChanges {

    map: any; //the leaflet map object
    gju: any;  // geoJson utility object
    observeTurboService: Observable<any>;


    turboAreas: Array<TurboArea> = [];
    isInsertTurboArea: boolean; //when in insert new mode for TurboArea
    isEditTurboArea: boolean; // when in edit mode for TurboArea
    tempTurboArea: TurboArea;
    bankTurboArea: TurboArea;

    currentEditedLayer: any;
    selectedScenario: string = null;

    routes: Array<SimRoute> = [];
    routesRealtime: Array<SimRoute> = [];

    routesToDraw: Array<SimRoute> = [];
    turboAreasToDraw: Array<TurboArea> = [];

    @Input() selectedScnario: string;
    @Input() routeChangedDate: number; //gets current date on each change
    selectedAltitude: number = -1;

    constructor(private mapService: MapService, private simroutesService: SimroutesService, private geoService: GeoHelperService) {

        this.gju = require('geojson-utils');
        this.tempTurboArea = new TurboArea();
        this.bankTurboArea = new TurboArea();
    }

    ngOnInit() {

        //init map
        this.initMapControl();
        this.initMapEvents();

        this.isEditTurboArea = false;
        this.isInsertTurboArea = false;
    }

    ngOnChanges(changes: SimpleChanges) {
        for (let propName in changes) {
            let chng = changes[propName];
            if (propName === 'selectedScnario') {
                if (chng.currentValue) {
                    this.selectedScenario = chng.currentValue;
                    this.scenarioChanged();
                }
            }
            else if (propName === 'routeChangedDate') {
                if (chng.currentValue){
                    this.scenarioChanged();
                }


            }
        }
    }


    /***************************
     init map
     ***************************/
    initMapControl() {

        this.map = L.map('mapid', {
            center: L.latLng(38, 15),
            zoom: 5,
        });

        var osmUrl = this.mapService.mapLayerURL;
        var osm = L.tileLayer(osmUrl, {minZoom: 3, maxZoom: 18});


        this.map.addLayer(osm);

    }

    /***************************
     init map events
     ***************************/
    initMapEvents() {
        this.map.on('mousemove', (e) => {

        });

    }


    scenarioChanged() {
        this.clearAllTurboAreas();
        this.initTurboAreaObserver();
        this.initSimroutes();
    }

    initSimroutes() {
        this.routes = [];
        this.routesRealtime = [];
        this.simroutesService.getSimroutes(this.selectedScenario).subscribe((item) => {
            this.routes.push(item);
        }, () => {
        }, () => {

            this.redrawAll();
            console.log(this.routes);
        });
    }

    /***************************
     redraw all
     ***************************/
    redrawAll() {
        this.clearAllTurboAreas();
        if (this.selectedAltitude === -1) {
            //draw turboareas
            this.turboAreas.forEach((item) => {
                this.drawTurboAreaOnMap(item);
            })

            //draw routes
            this.routes.forEach((item) => {
                this.drawRouteOnMap(item);

            })
        } else {
            //draw turboareas that fall within altitude
            const selectedLowerAlt = this.selectedAltitude * 2000 + 30000;
            const selectedUpperAlt = selectedLowerAlt + 1000;
            console.log(selectedLowerAlt);
            console.log(selectedUpperAlt);
            this.turboAreas.forEach((item) => {
                if (((selectedLowerAlt <= (item.altitude + item.heightSpan) && (selectedUpperAlt >= item.altitude)) ))
                    this.drawTurboAreaOnMap(item);
            })

            //draw routes that fall within altitude
            this.routes.forEach((item) => {
                if (item.altitude >= selectedLowerAlt && item.altitude <= selectedUpperAlt)
                this.drawRouteOnMap(item);

            })
        }

    }

    /***************************
     init TurboMap Observer
     ***************************/
    initTurboAreaObserver() {
        this.turboAreas = [];
        this.observeTurboService = this.mapService.getTurboAreas(this.selectedScenario);
        this.observeTurboService.subscribe((item: TurboArea) => {
            this.turboAreas.push(item);
        }, () => {
        }, () => {

            this.redrawAll();

        });

    }

    /***************************
     clear all map turbo areas
     ***************************/
    clearAllTurboAreas() {
        this.map.eachLayer((layer) => {
            //remove all layers that are not tile layers (that have _tile property)
            if (!layer._tiles) this.map.removeLayer(layer);
        });
    }

    /***************************
     draw turbo area on map
     ***************************/
    drawTurboAreaOnMap(turboArea: TurboArea) {


        //convert TurboArea to GeoJson
        var x: any = turboArea.getGeoJson();

        //style the view
        var myStyle: any = {
            "color": this.mapService.getColorbySeverity(turboArea.severity),
            "weight": 1,
            "opacity": 1.0,
            "fillOpacity": 0.5
        };

        //create the presentation layer
        var polygonLayer: any = L.geoJSON(x, {style: myStyle}).addTo(this.map);
        polygonLayer.turboArea = turboArea;

        //add user events to the layer
        polygonLayer.on('click', (e) => {

            if (!this.isEditTurboArea) {
                this.isEditTurboArea = true;
                this.bankTurboArea = polygonLayer.turboArea.createCopy();

                this.tempTurboArea = polygonLayer.turboArea;
                this.map.removeLayer(polygonLayer);
                this.currentEditedLayer = this.drawTurboAreaOnMap(this.tempTurboArea);
                this.currentEditedLayer.pm.enable({draggable: true});

            }


        });

        polygonLayer.on('pm:edit', (e) => {
            var newLatlngs: any = polygonLayer.getLayers()[0].getLatLngs();
            this.tempTurboArea.coordinates = [];
            newLatlngs[0].forEach((item: L.LatLng) => {
                this.tempTurboArea.addCoordinate([item.lng, item.lat]);
            });
        });

        return polygonLayer;
    }

    /***************************
     draw route  on map
     ***************************/
    drawRouteOnMap(route: SimRoute) {


        //convert route to GeoJson
        let x: any = this.geoService.bigCircleGeoJsonBetweenPoints(route.toAirport.latitude, route.toAirport.longitude, route.landAirport.latitude, route.landAirport.longitude);

        //style the view
        let myStyle: any = {
            "color": route.isRealtime ? 'red' : 'purple',
            "weight": 2,
            "opacity": 1.0,
            "fillOpacity": 1.0
        };

        //create the presentation layer
        let polygonLayer: any = L.geoJSON(x, {style: myStyle}).addTo(this.map);

        //add user events to the layer
        polygonLayer.on('click', (e) => {
            console.log(e);
        });
    }


    /***************************
     User interactions
     ***************************/
    addTurboAreaClicked() {
        let range: number = 180;
        this.tempTurboArea = new TurboArea();
        this.tempTurboArea.scenario = this.selectedScenario;
        this.tempTurboArea.altitude = 32000;
        this.tempTurboArea.severity = 2;
        this.tempTurboArea.heightSpan = 2000;
        var latlng = this.map.getCenter();
        this.tempTurboArea.addCoordinate([latlng.lng, latlng.lat]);
        var x = this.gju.destinationPoint({type: 'Point', coordinates: [latlng.lng, latlng.lat]}, 360, range);
        this.tempTurboArea.addCoordinate([x.coordinates[0], x.coordinates[1]]);
        var x1 = this.gju.destinationPoint(x, 90, range);
        this.tempTurboArea.addCoordinate([x1.coordinates[0], x1.coordinates[1]]);
        var x2 = this.gju.destinationPoint(x1, 180, range);
        this.tempTurboArea.addCoordinate([x2.coordinates[0], x2.coordinates[1]]);

        this.currentEditedLayer = this.drawTurboAreaOnMap(this.tempTurboArea);
        this.currentEditedLayer.pm.enable({draggable: true});
        this.isEditTurboArea = true;
        this.isInsertTurboArea = true;
    }

    cancel_clicked() {
        if (!this.isInsertTurboArea) {

            this.drawTurboAreaOnMap(this.bankTurboArea);

        }
        this.isInsertTurboArea = false;
        this.isEditTurboArea = false;
        this.currentEditedLayer.pm.disable();
        this.map.removeLayer(this.currentEditedLayer);

    }

    delete_clicked() {
        if (!this.isInsertTurboArea) {
            // remove band turbo area from service
            this.mapService.deleteTUrboArea(this.tempTurboArea._id).subscribe((res) => {
                this.initTurboAreaObserver();
            });
        }
        this.isInsertTurboArea = false;
        this.isEditTurboArea = false;
        this.map.removeLayer(this.currentEditedLayer);

    }

    submit_clicked() {
        if (this.isInsertTurboArea) {
            this.mapService.addTurboArea(this.tempTurboArea).subscribe((item: any) => {
                this.initTurboAreaObserver();
                // this.drawTurboAreaOnMap(item);
            });
            this.currentEditedLayer.pm.disable();
            this.map.removeLayer(this.currentEditedLayer);

        } else {
            this.mapService.editTurboArea(this.tempTurboArea).subscribe((item: any) => {
                this.initTurboAreaObserver();
            });
            //this.mapService.addTurboArea(this.tempTurboArea);
            this.currentEditedLayer.pm.disable();
            this.map.removeLayer(this.currentEditedLayer);
            this.currentEditedLayer = null;
        }
        this.isEditTurboArea = false;
        this.isInsertTurboArea = false;

    }

    /****************
     Altitude buttons
     ****************/
    altitudeselected(e) {
        this.selectedAltitude = e;
        this.redrawAll();
    }

}


