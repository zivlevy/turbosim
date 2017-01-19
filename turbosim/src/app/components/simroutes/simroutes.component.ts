import {Component, OnInit, ViewChild, Output,EventEmitter} from '@angular/core';
import {AirportPickerComponent} from "../airport-picker/airport-picker.component";
import {Airport} from "../../classes/airport";
import {SimRoute, Scenario} from "../../classes/simroute";
import {SimroutesService} from "../../services/simroutes.service";
import {Observable} from "rxjs";
import {ScenarioService} from "../../services/scenario.service";

@Component({
    selector: 'simroutes',
    templateUrl: './simroutes.component.html',
    styleUrls: ['./simroutes.component.css']
})
export class SimroutesComponent implements OnInit {
    @ViewChild(AirportPickerComponent) public readonly modal: AirportPickerComponent;
    toAirport: Airport;
    landAirport: Airport;
    isRealtime: boolean = false;
    whichAirport: string; // which airport button was clicked
    routes: Array<SimRoute> = [];
    routesRealtime: Array<SimRoute> = [];
    targetAltitude: number = 30000;

    //senarios
    arrScenarios: Array<Scenario> = [];
    selectedScenario: Scenario = null;
    observeScenarioService: Observable<any>;
    @Output() scenario_Changed : EventEmitter<any> = new EventEmitter();
    @Output() routes_Changed : EventEmitter<any> = new EventEmitter();

    constructor(private simroutesService: SimroutesService, private scenarioService: ScenarioService) {

    }

    ngOnInit() {

        this.initScenarioaObserver();
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

    /***************************
     init Scenario Observer
     ***************************/
    initScenarioaObserver() {
        this.observeScenarioService = this.scenarioService.getScenarios();
        this.observeScenarioService.subscribe((item: Scenario) => {
                this.arrScenarios.push(item);
            }, () => {
            },
            () => { //completion
                if (this.arrScenarios) {
                    this.selectedScenario = this.arrScenarios[0];
                    this.scenario_Changed.emit(this.selectedScenario._id);
                }
                this.initSimroutes();
            });

    }

    scenarioChanged() {
        this.initSimroutes();
        this.scenario_Changed.emit(this.selectedScenario._id);
    }


    initSimroutes() {
        this.routes = [];
        this.routesRealtime = [];
        this.simroutesService.getSimroutes(this.selectedScenario._id).subscribe((item) => {
            if (item.isRealtime) {
                this.routesRealtime.push(item);
            } else {
                this.routes.push(item);
            }

        });
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
    setAltitude(e) {

        this.targetAltitude = Number(e.target.value);
    }

    addRoute() {
        let route = new SimRoute();
        route.toAirport = this.toAirport;
        route.landAirport = this.landAirport;
        route.altitude = this.targetAltitude;
        route.scenario = this.selectedScenario._id;
        route.isRealtime = this.isRealtime;
        this.simroutesService.addSimroute(route).subscribe((item: any) => {
            if (item.isRealtime) {
                this.routesRealtime.push(item);
            } else {
                this.routes.push(item);
            }

        },()=>{},
            ()=>{this.routes_Changed.emit(new Date());});
        ;


    }

    deleteRoute(route: SimRoute, index) {
        this.simroutesService.deleteSimroute(route._id).subscribe((item: any) => {
            if (item.isRealtime) {
                this.routesRealtime.splice(index, 1);
            } else {
                this.routes.splice(index, 1);
            }


        },()=>{},
            ()=>{this.routes_Changed.emit(new Date());});
        ;


    }

    /***********************
     *  airport selection
     **********************/
    showModal(e, which, topDiff = 0, leftDiff = 0) {
        this.whichAirport = which === 'takeoff' ? 'takeoff' : 'landing';
        this.modal.show(e.clientX + leftDiff, e.clientY + topDiff);
    }
}