import {Airport} from "./airport";
export class SimRoute {
    _id: string;
    scenario:string;
    toAirport:Airport;
    landAirport:Airport;
    altitude:number;
    isRealtime: boolean;

}

export class Scenario {
    _id:string;
    name:string;
    toAirport:string;
    landAirport:string;
}
