import {Injectable} from '@angular/core';
import {Http, Response, Headers, RequestOptions} from '@angular/http';
import {Observable, Subject} from 'rxjs';
import {TurboArea} from '../classes/turbo-area';
import {environment} from '../../environments/environment';
// Import RxJs required methods
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';
import {isUndefined} from "util";
import {GeoHelperService} from "./geo-helper.service";
import {Cloud, CrossWind, Freeze, Lightning} from "../classes/weatherInfo";
import {BehaviorSubject} from "rxjs/BehaviorSubject";

@Injectable()
export class MapService {
    turboAreas: Array<TurboArea>;
    turboAreaList: Subject<any>;
    subscription: any;
    gju: any; // geoJson utility object
    mapLayerURL: string;
    baseUrl: string;

    //turbulence
    myTurbulence: Array<Map<string,Tile>> =[];
    myTurbulence_temp: Array<Map<string,Tile>> =[];


    //weather info
    myClouds:Map<string,Cloud> = new Map();
    myCloudList: BehaviorSubject<Map<string,Cloud>> = new BehaviorSubject(new Map());

    myLightnings:Map<string,Lightning> = new Map();
    myLightningsList: BehaviorSubject<Map<string,Lightning>> = new BehaviorSubject(new Map());

    myFreeze:Map<string,Freeze> = new Map();
    myFreezeList: BehaviorSubject<Map<string,Freeze>> = new BehaviorSubject(new Map());

    myCrossWind:Map<string,CrossWind> = new Map();
    myCrossWindList: BehaviorSubject<Map<string,CrossWind>> = new BehaviorSubject(new Map());


    constructor(private http: Http, private geoHelperService: GeoHelperService) {
        // private instance variable to hold base url

        this.baseUrl = environment.turboAreaServer + 'turboareas';// 'http://localhost:3000/turboareas';
        // this.baseUrl = 'http://localhost:3000/turboareas';
        this.gju = require('geojson-utils');
        this.turboAreas = [];


        //init map info
        this.mapLayerURL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';


        // this.subscription = this.getTurboAreas().subscribe((item:any) => {
        //   this.turboAreas.push(item);
        // });
    }

    setScenario(scenarioId, callback) {

        if (this.subscription) this.subscription.unsubscribe();
        //init turbulence for all heights
        this.myTurbulence = [];
        this.myTurbulence_temp = [];
        for (let i: number = 0; i < 5; i++) {
            this.myTurbulence.push(new Map());
            this.myTurbulence_temp.push(new Map());

        }

        this.turboAreaList = new Subject();

        this.turboAreas = [];
        this.subscription = this.getTurboAreas(scenarioId).subscribe((item: any) => {
            this.turboAreas.push(item);
        },(err)=>{},()=>{
             callback();
        });
    }

    getColorbySeverity(severity: number) {
        var color;
        switch (Number(severity)) {
            case 1:
                color = 'green';
                break;
            case 2:
                color = 'yellow';
                break;
            case 3:
                color = 'orange';
                break;
            case 4:
                color = 'pink';
                break;
            case 5:
                color = 'red';
                break;
        }
        return color;
    }

    /****************************
     * Turbulence
     ****************************/
    airplaneAtLocation(lat: number, lng: number, alt: number) {
        const altLevel = Math.floor(((alt / 1000) - 30) / 2);

        if (altLevel >= 0) {

            const tileY = this.geoHelperService.lat2tile(lat, 11);
            const tileX = this.geoHelperService.long2tile(lng, 11);

            //check if there is already turbulence in this tile
            const severityInLocaation = this.myTurbulence[altLevel].get(tileX + '/' + tileY + '/' + (altLevel + 10));
            if (isUndefined(severityInLocaation)) {

                let tile: Tile = new Tile();
                tile = this.getTurbulenceAtLocation(lat, lng, alt);
                this.myTurbulence[altLevel].set(tileX + '/' + tileY + '/' + (altLevel + 10), tile);
                this.myTurbulence_temp[altLevel].set(tileX + '/' + tileY + '/' + (altLevel + 10), tile);


            }
        }
    }

    getTurbulenceByAlt(alt: number) {
        let arr: Tile [] = [];

        if (!this.myTurbulence[alt] || alt <0) return arr;
        this.myTurbulence[alt].forEach((item) => {
            arr.push(item);
        });
        return arr;
    }

    getTurbulenceByAlt_temp(alt: number) {
        let arr: Tile [] = [];
        if (!this.myTurbulence_temp[alt] || alt <0) return arr;
        this.myTurbulence_temp[alt].forEach((item) => {
            arr.push(item);
        });
        return arr;
    }


    getTurbulenceMapByAlt(alt: number) {
        let map: Map<string,Tile>;
        map = this.myTurbulence[alt];
        return map;
    }

    getTurbulenceMapByAlt_temp(alt: number) {
        let map: Map<string,Tile>;
        map = this.myTurbulence_temp[alt];
        return map;
    }

    resetTurbulence_temp() {
        this.myTurbulence_temp = [];
        for (let i: number = 0; i < 5; i++) {
            this.myTurbulence_temp.push(new Map());

        }
    }

    /****************************
     * get Severity from location
     ****************************/
    getTurbulenceAtLocation(lat, lng, alt) {

        let maxSeverity = 0;

        this.turboAreas.forEach((turboArea: TurboArea) => {
            //find if in the altitude span
            if (turboArea.altitude <= alt && turboArea.altitude + turboArea.heightSpan >= alt) {
                //check that the location falls within this area
                let y: boolean = this.gju.pointInPolygon({"type": "Point", "coordinates": [lng, lat]},
                    {"type": "Polygon", "coordinates": turboArea.coordinates});
                if (y && maxSeverity < turboArea.severity) maxSeverity = turboArea.severity;
            }
        });
        let tile = new Tile();
        tile.alt = Math.floor(((alt / 1000) - 30) / 2);
        tile.tileY = this.geoHelperService.lat2tile(lat, 11);
        tile.tileX = this.geoHelperService.long2tile(lng, 11);
        tile.severity = maxSeverity;
        return tile;
    }

    /****************************
     * Rest API
     ****************************/

    convertJsonToTurboArea(item: TurboArea): TurboArea {
        var turboArea: TurboArea = new TurboArea();
        turboArea._id = item._id;
        turboArea.altitude = item.altitude;
        turboArea.heightSpan = item.heightSpan;
        turboArea.severity = item.severity;
        turboArea.coordinates = item.coordinates.slice();
        return turboArea;
    }

    getTurboAreas(scenarioId: string): Observable<TurboArea[]> {

        return this.http.get(this.baseUrl + '/byscenario/' + scenarioId)
        // ...and calling .json() on the response to return data
            .map((res: Response) => res.json())
            .flatMap((x) => {
                var y = [];
                x.forEach((item: TurboArea) => {
                    y.push(this.convertJsonToTurboArea(item));
                });
                return y;
            })

            //...errors if any
            .catch((error: any) => Observable.throw(error.json().error || 'Server error'));

    }

    deleteTUrboArea(id: string): Observable<Comment[]> {
        return this.http.delete(`${this.baseUrl}/${id}`) // ...using put request
            .map((res: Response) => res.json()) // ...and calling .json() on the response to return data
            .catch((error: any) => Observable.throw(error.json().error || 'Server error')); //...errors if any
    }

    addTurboArea(body: Object): Observable<TurboArea[]> {
        let bodyString = JSON.stringify(body); // Stringify payload
        let headers = new Headers({'Content-Type': 'application/json'}); // ... Set content type to JSON
        let options = new RequestOptions({headers: headers}); // Create a request option
        return this.http.post(this.baseUrl, bodyString, options) // ...using post request
            .map((res: Response) => res.json())
            .map((x) => {
                return this.convertJsonToTurboArea(x);
            })
            .catch((error: any) => Observable.throw(error.json().error || 'Server error')); //...errors if any
    }

    editTurboArea(body: any): Observable<TurboArea[]> {
        let bodyString = JSON.stringify(body); // Stringify payload
        let headers = new Headers({'Content-Type': 'application/json'}); // ... Set content type to JSON
        let options = new RequestOptions({headers: headers}); // Create a request option
        return this.http.put(`${this.baseUrl}/${body._id}`, bodyString, options) // ...using post request
            .map((res: Response) => res.json())
            .map((x) => {
                return this.convertJsonToTurboArea(x);
            })
            .catch((error: any) => Observable.throw(error.json().error || 'Server error')); //...errors if any
    }


    /*********************
    Weather  info
    *********************/
    reportCloud(lat:number,lng:number,tops:number) {
        const cloud = new Cloud();
        cloud.tileX=this.geoHelperService.long2tile(lng, 11);
        cloud.tileY = this.geoHelperService.lat2tile(lat, 11);
        cloud.height = tops;
        this.myClouds.set(cloud.tileX +'/'+ cloud.tileY , cloud);
        this.myCloudList.next(this.myClouds);
        console.log(this.myClouds)
    }

    getCloudInfo(){
        return this.myCloudList.asObservable();
    }

    reportLighning(lat:number,lng:number,altitude:number) {
    const lightning = new Lightning();
    lightning.tileX=this.geoHelperService.long2tile(lng, 11);
    lightning.tileY = this.geoHelperService.lat2tile(lat, 11);
    lightning.height = altitude;
    this.myLightnings.set(lightning.tileX +'/'+ lightning.tileY , lightning);
    this.myLightningsList.next(this.myLightnings);
    console.log(this.myLightnings)
}
    getLightningInfo(){
        return this.myLightningsList.asObservable();
    }

    reportFreeze(lat:number,lng:number,altitude:number) {
        console.log(lat)
        const freeze = new Freeze();
        freeze.tileX=this.geoHelperService.long2tile(lng, 11);
        freeze.tileY = this.geoHelperService.lat2tile(lat, 11);
        freeze.height = altitude;
        this.myFreeze.set(freeze.tileX +'/'+ freeze.tileY , freeze);
        this.myFreezeList.next(this.myFreeze);
    }
    getFreezeInfo(){
        return this.myFreezeList.asObservable();
    }


    reportCrosWind(lat:number,lng:number,altitude:number) {
        const wind = new CrossWind();
        wind.tileX=this.geoHelperService.long2tile(lng, 11);
        wind.tileY = this.geoHelperService.lat2tile(lat, 11);
        wind.height = altitude;
        this.myCrossWind.set(wind.tileX +'/'+ wind.tileY , wind);
        this.myCrossWindList.next(this.myCrossWind);
    }
    getCrossWindInfo(){
        return this.myCrossWindList.asObservable();
    }

    // reset weather
    resetWeather(){
        this.myCrossWind=new Map();
        this.myCrossWindList.next(this.myCrossWind);
        this.myFreeze=new Map();
        this.myFreezeList.next(this.myFreeze);
        this.myLightnings=new Map();
        this.myLightningsList.next(this.myLightnings);
        this.myClouds=new Map();
        this.myCloudList.next(this.myClouds);

    }



}

export class Tile {
    tileX: number;
    tileY: number;
    alt: number;
    severity: number;
}

