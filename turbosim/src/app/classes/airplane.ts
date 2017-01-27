import {SimulatorService} from "../services/simulator.service";
import {GeoHelperService} from "../services/geo-helper.service";
import {Injectable} from "@angular/core";
import {ReflectiveInjector} from '@angular/core';


@Injectable()
export class Airplane {
    routePoints: Array <{lat: number, lng: number}>;
    greatCircleArray: Array <{lat: number, lng: number}>;
    currentPosition: {lat: number, lng: number};
    currentAzimuth: number;
    currentAltitude: number;
    targetAltitude: number;// the altitude the airplane needs to get to
    currentwaypoint: number; //the waypoint the airplane is headed to

    distancePerTick: number = 1;
    counter: number = 0;
    isLanded: boolean = false;
    geoHelperService: GeoHelperService;
    simulatorService: SimulatorService;


    constructor(from, to, targetAltitude) {
        let injector = ReflectiveInjector.resolveAndCreate([GeoHelperService, SimulatorService]);
        this.geoHelperService = injector.get(GeoHelperService);
        this.simulatorService = injector.get(SimulatorService);

        this.currentAltitude = 25000;
        this.targetAltitude = targetAltitude;
        this.initRoute(from, to);


    }

    simTick() {
        this.move();
    }

    currentAltitudeLevel() {
        return (Math.floor((this.currentAltitude - 30000) / 2000));
    }

    move(): number {

        if (this.currentwaypoint > this.greatCircleArray.length - 1) {
            this.isLanded = true;
            return;
        }
        ;
        //new altitude
        if (this.targetAltitude !== this.currentAltitude) {
            this.currentAltitude = this.targetAltitude > this.currentAltitude ? this.currentAltitude + 500 : this.currentAltitude - 500;
        }
        //new position
        this.currentPosition = this.geoHelperService.newLocationFromPointWithDistanceBearing(this.currentPosition, this.distancePerTick, this.currentAzimuth);
        this.currentAzimuth = this.geoHelperService.bigCircleAzimuth(this.currentPosition, this.greatCircleArray[this.currentwaypoint]);
        let dist = this.geoHelperService.dist(this.currentPosition.lat, this.currentPosition.lng, this.greatCircleArray[this.currentwaypoint].lat, this.greatCircleArray[this.currentwaypoint].lng);

        //check if there is turbulence

        if (dist < this.distancePerTick * 1600 * 1.1) {
            this.currentwaypoint++;
        }
    }

    gotoAltitude(altitude: number) {
        this.targetAltitude = altitude;
    }

    /***********************
     *  route
     **********************/
    initRoute(from, to) {
        this.routePoints = [];
        this.routePoints.push({lat: from.lat, lng: from.lng});
        this.routePoints.push({lat: to.lat, lng: to.lng});
        this.greatCircleArray = this.geoHelperService.bigCircleBetweenPoints(this.routePoints[0], this.routePoints[1]);
        this.currentwaypoint = 1;
        this.currentPosition = {
            lat: this.greatCircleArray[0].lat,
            lng: this.greatCircleArray[0].lng
        }
        this.currentAzimuth = this.geoHelperService.bigCircleAzimuth(this.greatCircleArray[0], this.greatCircleArray[1]);

    };


}
