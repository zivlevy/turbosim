import {Airport} from "./airport";
export class SimRoute {
    toAirport:Airport;
    landAirport:Airport;
    altitude:number;

}

export class Scenario {
    _id:string;
    name:string;
    routes: Array<SimRoute>;
}
