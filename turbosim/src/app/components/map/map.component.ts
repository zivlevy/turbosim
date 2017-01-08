import {Component, OnInit, ViewChild} from '@angular/core';
import {MapService} from '../../services/map.service';
import {Observable} from "rxjs";
import {TurboArea} from "../../classes/turbo-area";
import 'leaflet';
import 'leaflet.pm';
import GeoJsonObject = GeoJSON.GeoJsonObject;
import GeoJSONOptions = L.GeoJSONOptions;

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css']
})
export class MapComponent implements OnInit {

  map: any; //the leaflet map object
  mapService: MapService;
  gju: any;  // geoJson utility object
  observeTurboService: Observable<any>;

  isInsertTurboArea: boolean; //when in insert new mode for TurboArea
  isEditTurboArea: boolean; // when in edit mode for TurboArea
  tempTurboArea: TurboArea;
  bankTurboArea: TurboArea;

  currentEditedLayer: any;

  constructor(mapService: MapService) {
    this.mapService = mapService;
    this.gju = require('geojson-utils');
    this.tempTurboArea = new TurboArea();
    this.bankTurboArea = new TurboArea();
  }

  ngOnInit() {

    //init map
    this.initMapControl();
    this.initMapEvents();

    //init TurboArea observer
    this.initTurboAreaObserver();

    this.isEditTurboArea = false;
    this.isInsertTurboArea = false;
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
    this.map.on('mousemove',(e)=>{
      this.map.eachLayer((layer)=>{
        if (layer.turboArea){
          console.log(layer.turboArea.isPointInArea(e.latlng.lng, e.latlng.lat,38000));
        }
      })
    });

  }

  /***************************
   init TurboMap Observer
   ***************************/
  initTurboAreaObserver() {
    this.observeTurboService = this.mapService.getTurboAreas();
    this.observeTurboService.subscribe((item: TurboArea) => {
      console.log(item);
      this.drawTurboAreaOnMap(item);
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
        console.log(this.bankTurboArea);
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
   User interactions
   ***************************/
  addTurboAreaClicked() {
    let range: number = 180;
    this.tempTurboArea = new TurboArea();
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
    console.log(this.currentEditedLayer);


  }

  cancel_clicked() {
    if (!this.isInsertTurboArea) {
      console.log(this.bankTurboArea);
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
      this.mapService.deleteTUrboArea(this.tempTurboArea._id).subscribe((res) => console.log(res));
    }
    this.isInsertTurboArea = false;
    this.isEditTurboArea = false;
    this.map.removeLayer(this.currentEditedLayer);
  }

  submit_clicked() {
    if (this.isInsertTurboArea) {
      this.mapService.addTurboArea(this.tempTurboArea).subscribe((item: any) => {

        this.drawTurboAreaOnMap(item);
      });
      this.currentEditedLayer.pm.disable();
      this.map.removeLayer(this.currentEditedLayer);

    } else {
      this.mapService.editTurboArea(this.tempTurboArea).subscribe((item: any) => {
        this.drawTurboAreaOnMap(item);
      });
      //this.mapService.addTurboArea(this.tempTurboArea);
      this.currentEditedLayer.pm.disable();
      this.map.removeLayer(this.currentEditedLayer);
      this.currentEditedLayer = null;
    }
    this.isEditTurboArea = false;
    this.isInsertTurboArea = false;

  }


}


