import {Tile} from "../services/map.service";
import {Airplane} from "./airplane";
import {GeoHelperService} from "../services/geo-helper.service";
export class AlertManager {
    static MapUtils: GeoHelperService = new GeoHelperService;
    static kAlertAngle: number = 15;
    static kAlertRange: number = 100;
    static maxbelow: number = 0;
    static maxAt: number = 0;
    static maxAbove: number = 0;


    public static getAlertLevel(arrTurbelenceBelow: Map<string,Tile>, arrTurbelenceAt: Map<string,Tile>, arrTurbelenceAbove: Map<string,Tile>, airplane: Airplane , alertLevel:number = 2) {
        this.maxAbove = 0;
        this.maxAt = 0;
        this.maxbelow = 0;
        let currentAltLevel = airplane.currentAltitudeLevel();
        let currentTile: Tile = new Tile();
        currentTile.tileY = this.MapUtils.lat2tile(airplane.currentPosition.lat, 11);
        currentTile.tileX = this.MapUtils.long2tile(airplane.currentPosition.lng, 11);

        for (let az: number = -this.kAlertAngle; az <= this.kAlertAngle; az += 3) {
            let currentCalcCourse: number = airplane.currentAzimuth + az;

            //correct to 0-359
            if (currentCalcCourse >= 360) currentCalcCourse -= 360;
            if (currentCalcCourse <= 0) currentCalcCourse = 360 + currentCalcCourse;

            //step every 5 miles to make sure we cover all tiles in range
            for (let i: number = 0; i <= this.kAlertRange; i += 5) {
                //get cordinate
                let stepWP = this.MapUtils.newLocationFromPointWithDistanceBearing(airplane.currentPosition, i, currentCalcCourse);//currentLocation.course];

                //get the tile at that location
                let tile: Tile = new Tile();
                tile.tileY = this.MapUtils.lat2tile(stepWP.lat, 11);
                tile.tileX = this.MapUtils.long2tile(stepWP.lng, 11);

                //check that we are not on current tile
                if (currentTile.tileX != tile.tileX || currentTile.tileY != tile.tileY) {
                    let tileBelow: Tile = arrTurbelenceBelow.get(tile.tileX + '/' + tile.tileY + '/' + (currentAltLevel - 1 + 10));
                    if (tileBelow) {
                        if (tileBelow.severity > this.maxbelow) this.maxbelow = tileBelow.severity;
                    }

                    let tileAt: Tile = arrTurbelenceAt.get(tile.tileX + '/' + tile.tileY + '/' + (currentAltLevel + 10));
                    if (tileAt) {
                        if (tileAt.severity > this.maxAt) {
                            this.maxAt = tileAt.severity;
                        }
                    }

                    let tileAbove: Tile = arrTurbelenceAbove.get(tile.tileX + '/' + tile.tileY + '/' + (currentAltLevel + 1 + 10));
                    if (tileAbove) {
                        if (tileAbove.severity > this.maxAbove) this.maxAbove = tileAbove.severity;
                    }
                }
            }
        }
        console.log(alertLevel);
        let isAlert = (this.maxbelow >= alertLevel || this.maxAt >= alertLevel || this.maxAbove >= alertLevel) ? true : false;
        return {
            isAlert: isAlert,
            below: AlertManager.MapUtils.getColorBySeverity(this.maxbelow, true),
            at: AlertManager.MapUtils.getColorBySeverity(this.maxAt, true),
            above: AlertManager.MapUtils.getColorBySeverity(this.maxAbove, true)
        }
    }
}
