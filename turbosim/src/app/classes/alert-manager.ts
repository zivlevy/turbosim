import {Tile} from "../services/map.service";
import {Airplane} from "./airplane";
import {GeoHelperService} from "../services/geo-helper.service";
export class AlertManager {
    static MapUtils: GeoHelperService = new GeoHelperService;
    static kAlertAngle: number = 15;
    static kAlertRange: number = 100;

    public static getAlertLevel(arrTurbelenceBelow: Array<Tile>, arrTurbelenceAt: Array<Tile>, arrTurbelenceAbove: Array<Tile>, airplane: Airplane) {

        for (let az: number = -this.kAlertAngle; az <= this.kAlertAngle; az += 5) {
            let currentCalcCourse: number = airplane.currentAzimuth + az;

            //correct to 0-359
            if (currentCalcCourse >= 360) currentCalcCourse -= 360;
            if (currentCalcCourse <= 0) currentCalcCourse = 360 + currentCalcCourse;
            //step every 5 miles to make sure we cover all tiles in range
            for (let i: number = 0; i <= this.kAlertRange; i += 5) {
                //get cordinate
                let stepWP = this.MapUtils.newLocationFromPointWithDistanceBearing(airplane.currentPosition, i, az);//currentLocation.course];

                //get the tile at that location


                let tile:Tile = new Tile ();
                tile.tileY = this.MapUtils.lat2tile(stepWP.lat,11);
                tile.tileX= this.MapUtils.long2tile(stepWP.lng,11);

                console.log (tile);
                return {isAlert: true, below: 'red', at: 'yellow', above: 'green'}

            }


        }
    }
}
