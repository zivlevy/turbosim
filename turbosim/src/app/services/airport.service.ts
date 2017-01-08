import {Injectable} from '@angular/core';
import {Http} from '@angular/http';

@Injectable()
export class AirportService {
  airports: Array<any>;

  constructor(private http: Http) {
  }

  getAirports() {
    return this.http.request('../assets/data/airports.json')
      .map(res => res.json());
  }
}
