import { Injectable } from '@angular/core';
import {Http, Response, Headers, RequestOptions} from '@angular/http';
import {Observable, Subject} from 'rxjs';
import {SimRoute,Scenario} from "../classes/simroute";
import {environment} from '../../environments/environment';


@Injectable()
export class SimroutesService {

  baseUrl: string;
  constructor(private http: Http) {
    this.baseUrl = environment.turboAreaServer +'simroutes';

  }


  /****************************
   * Rest API
   ****************************/

  convertJsonToSSimroute(item: SimRoute): SimRoute {

    var simroute: SimRoute = new SimRoute();
    simroute._id = item._id;
    simroute.scenario= item.scenario;
    simroute.altitude = item.altitude;
    simroute.toAirport = item.toAirport;
    simroute.landAirport=item.landAirport;
    simroute.isRealtime= item.isRealtime;
    return simroute;

  }

  getSimroutes(scenarioId:string): Observable<SimRoute> {

    return this.http.get(this.baseUrl + '/byscenario/' + scenarioId)
        .map((res: Response) => res.json())
        .flatMap((x) => {
          var y = [];
          x.forEach((item: SimRoute) => {
            y.push(this.convertJsonToSSimroute(item));
          });
          return y;
        })

        //...errors if any
        .catch((error: any) => Observable.throw(error.json().error || 'Server error'));

  }

  deleteSimroute(id: string): Observable<Comment[]> {
    return this.http.delete(`${this.baseUrl}/${id}`) // ...using put request
        .map((res: Response) => res.json()) // ...and calling .json() on the response to return data
        .catch((error: any) => Observable.throw(error.json().error || 'Server error')); //...errors if any
  }

  addSimroute(body: Object): Observable<Scenario[]> {
    let bodyString = JSON.stringify(body); // Stringify payload
    let headers = new Headers({'Content-Type': 'application/json'}); // ... Set content type to JSON
    let options = new RequestOptions({headers: headers}); // Create a request option
    return this.http.post(this.baseUrl, bodyString, options) // ...using post request
        .map((res: Response) => res.json())
        .map((x) => {
          return this.convertJsonToSSimroute(x);
        })
        .catch((error: any) => Observable.throw(error.json().error || 'Server error')); //...errors if any
  }

  editSimroute(body: any): Observable<Scenario[]> {
    let bodyString = JSON.stringify(body); // Stringify payload
    let headers = new Headers({'Content-Type': 'application/json'}); // ... Set content type to JSON
    let options = new RequestOptions({headers: headers}); // Create a request option
    return this.http.put(`${this.baseUrl}/${body._id}`, bodyString, options) // ...using post request
        .map((res: Response) => res.json())
        .map((x) => {
          return this.convertJsonToSSimroute(x);
        })
        .catch((error: any) => Observable.throw(error.json().error || 'Server error')); //...errors if any
  }
}
