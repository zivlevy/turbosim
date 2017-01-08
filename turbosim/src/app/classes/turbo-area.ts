var GeoJSON = require('geojson');


export class TurboArea {
  _id: string;
  altitude: number;
  severity: number;
  heightSpan: number;
  coordinates: Array <[[number, number]]>;
  gju: any; // geoJson utility object

  constructor() {
    this.gju = require('geojson-utils');
    this.altitude = 32000;
    this.severity = 3;
    this.heightSpan = 2000;
    this.coordinates = [];
  }

  public addCoordinate(item: any) {
    if (this.coordinates.length === 0) {
      var x: any = [];
      this.coordinates.push(x);
    }
    this.coordinates[0].push(item);
  }

  public createCopy(): TurboArea {
    var clone: TurboArea = new TurboArea();
    clone._id = this._id;
    clone.altitude = this.altitude;
    clone.severity = this.severity;
    clone.heightSpan = this.heightSpan;
    clone.coordinates = this.coordinates.slice();
    return clone;
  }

  public update(turboArea: TurboArea) {
    this.altitude = turboArea.altitude;
    this.severity = turboArea.severity;
    this.heightSpan = turboArea.heightSpan;
    this.coordinates = turboArea.coordinates.slice();

  }

  public getGeoJson() {
    var data = {
      altitude: this.altitude,
      severity: this.severity,
      heightSpan: this.heightSpan,
      coordinates: this.coordinates
    };
    var x = GeoJSON.parse(data, {'Polygon': 'coordinates'});
    return x;
  }

  public isPointInArea(lat: number, lng: number, altitude: number): boolean {


    if (this.altitude > altitude || this.altitude + this.heightSpan < altitude) return false;
    var y = this.gju.pointInPolygon({"type": "Point", "coordinates": [lat, lng]}, {"type": "Polygon", "coordinates": this.coordinates});
    return y;
  }

}
