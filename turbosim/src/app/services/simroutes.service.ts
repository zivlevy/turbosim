import { Injectable } from '@angular/core';
import {Http, Response, Headers, RequestOptions} from '@angular/http';
import {Observable, Subject} from 'rxjs';
import {SimRoute,Scenario} from "../classes/simroute";
import {environment} from '../../environments/environment';

@Injectable()
export class SimroutesService {
    baseUrl: string;
  constructor(private http: Http) {
      this.baseUrl = environment.turboAreaServer + 'simroutes';// 'http://localhost:3000/turboareas';

  }


  /****************************
   * Rest API
   ****************************/

  convertJsonToScenario(item: Scenario): Scenario {

    var scenarrio: Scenario = new Scenario();
    scenarrio._id = item._id;
    scenarrio.name= item.name;
    scenarrio.routes = item.routes.slice();

    return scenarrio;

  }

  getScenarios(): Observable<Scenario[]> {

    return this.http.get(this.baseUrl)
        .map((res: Response) => res.json())
        .flatMap((x) => {
          var y = [];
          x.forEach((item: Scenario) => {
            y.push(this.convertJsonToScenario(item));
          });
          return y;
        })

        //...errors if any
        .catch((error: any) => Observable.throw(error.json().error || 'Server error'));

  }

  deleteScenario(id: string): Observable<Comment[]> {
    return this.http.delete(`${this.baseUrl}/${id}`) // ...using put request
        .map((res: Response) => res.json()) // ...and calling .json() on the response to return data
        .catch((error: any) => Observable.throw(error.json().error || 'Server error')); //...errors if any
  }

  addScenario(body: Object): Observable<Scenario[]> {
    let bodyString = JSON.stringify(body); // Stringify payload
    let headers = new Headers({'Content-Type': 'application/json'}); // ... Set content type to JSON
    let options = new RequestOptions({headers: headers}); // Create a request option
    return this.http.post(this.baseUrl, bodyString, options) // ...using post request
        .map((res: Response) => res.json())
        .map((x) => {
          return this.convertJsonToScenario(x);
        })
        .catch((error: any) => Observable.throw(error.json().error || 'Server error')); //...errors if any
  }

  editScenario(body: any): Observable<Scenario[]> {
    let bodyString = JSON.stringify(body); // Stringify payload
    let headers = new Headers({'Content-Type': 'application/json'}); // ... Set content type to JSON
    let options = new RequestOptions({headers: headers}); // Create a request option
    return this.http.put(`${this.baseUrl}/${body._id}`, bodyString, options) // ...using post request
        .map((res: Response) => res.json())
        .map((x) => {
          return this.convertJsonToScenario(x);
        })
        .catch((error: any) => Observable.throw(error.json().error || 'Server error')); //...errors if any
  }
}
