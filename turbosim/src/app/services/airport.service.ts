import {Injectable} from '@angular/core';
import {Http} from '@angular/http';
import {Airport} from "../classes/airport";
import {Observable} from "rxjs";

@Injectable()
export class AirportService {
    airports: Map<string,Airport> = new Map<string,Airport>();
arr:Array<Airport> = [];
    constructor(private http: Http) {
        console.log('start');
        this.getAirports().subscribe((airports) => {
            this.arr = airports;
        }, () => {
        }, () => console.log('end loading airports'));
    }

    getAirports(){
        return this.http.request('../assets/data/airports.json').map(res => res.json()).share();
    }

    getAirportByICAO (ICAO:string) {


         let airport:Airport = this.arr.filter((item:Airport)=>item.ICAO === ICAO)[0];
        console.log(airport);
         return airport;
    }


}
