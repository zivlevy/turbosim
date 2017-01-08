import { Component, OnInit ,ViewChild} from '@angular/core';
import {AirportPickerComponent} from "../airport-picker/airport-picker.component";
import {Airport} from "../../classes/airport";
import {SimRoute, Scenario} from "../../classes/simroute";
import {SimroutesService} from "../../services/simroutes.service";

@Component({
  selector: 'app-scenario',
  templateUrl: './scenario.component.html',
  styleUrls: ['./scenario.component.css']
})
export class ScenarioComponent implements OnInit {
  @ViewChild(AirportPickerComponent) public readonly modal: AirportPickerComponent;
  toAirport: Airport;
  landAirport: Airport;
  whichAirport: string; // which airport button was clicked
  routes:Array<SimRoute> =[];
  scenarios:Array <Scenario>;
  targetAltitude:number = 30000;

  constructor(private simRoutesService: SimroutesService) {

  }

  ngOnInit() {

    this.initRoutes();
    this.initScenarios();
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
  }

  initScenarios(){
     this.simRoutesService.getScenarios().subscribe((item)=>{
      console.log(item);
    });
  }
  initRoutes(){
    this.routes = [];
  }
  airportSelected(airport: Airport) {
    if (this.whichAirport === 'takeoff') {
      this.toAirport = airport;
    } else {
      this.landAirport = airport;
    }
    // this.initRoute();
  }


  /***********************
   *  route
   **********************/
  setAltitude(e){

    this.targetAltitude = Number(e.target.value);
  }
  addRoute(){
    let route = new SimRoute();
    route.toAirport = this.toAirport;
    route.landAirport = this.landAirport;
    route.altitude = this.targetAltitude;
    this.routes.push(route);
    console.log(this.routes);
  }
  deleteRoute(e){

    this.routes.splice(e,1);

  }

  /***********************
   *  airport selection
   **********************/
  showModal(e, which, topDiff =0 , leftDiff =0) {
    this.whichAirport = which === 'takeoff' ? 'takeoff' : 'landing';
    this.modal.show(e.clientX + leftDiff, e.clientY +topDiff );
  }
}
