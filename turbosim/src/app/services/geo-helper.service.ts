import {Injectable} from '@angular/core';

@Injectable()
export class GeoHelperService {

  constructor() {
  }

  /*tile conversion */
  tile2long  (x, z) {
    return (x / Math.pow(2, z) * 360 - 180);
  }

  tile2lat  (y, z) {
    let n = Math.PI - 2 * Math.PI * y / Math.pow(2, z);
    return (180 / Math.PI * Math.atan((Math.exp(n) - Math.exp(-n)) / 2));
  }

  long2tile  (lon, zoom) {
    return (Math.floor((lon + 180) / 360 * Math.pow(2, zoom)));
  }

  lat2tile  (lat, zoom) {
    return (
      Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom)));
  }


  getColorBySeverity  (severity, isDay) {
    if (!isDay) severity += 10;
    switch (severity) {
      case 0:
        return 'white';
      case 1:
        return '#0EFF00';
      case 2:
        return '#F2FF0C';
      case 3:
        return '#FFA600';
      case 4:
        return '#FA0000';
      case 5:
        return '#FF00C3';
      //night mode
      case 10:
        //return 'white';
        return '#d3cccd';
      case 11:
        return '#0EFF00';
      case 12:
        return '#F2FF0C';
      case 13:
        return '#FFA600';
      case 14:
        return '#FA0000';
      case 15:
        return '#FF00C3';
      default:
        return 'white';
    }
  }

  dist  (lat1, lon1, lat2, lon2) {
    let R = 6378137; // metres
    let φ1 = lat1 * Math.PI / 180;
    let φ2 = lat2 * Math.PI / 180;
    let Δφ = (lat2 - lat1) * Math.PI / 180;
    let Δλ = (lon2 - lon1) * Math.PI / 180;

    let a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) *
      Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    let d = R * c;
    return d;
  }


bigCircleBetweenPoints  (start, end) : any {

  let lat1 = start.lat * (Math.PI / 180);
  let lon1 = start.lng * (Math.PI / 180);
  let lat2 = end.lat * (Math.PI / 180);
  let lon2 = end.lng * (Math.PI / 180);
  let d = 2 * Math.asin(Math.sqrt(Math.pow((Math.sin((lat1 - lat2) / 2)), 2) + Math.cos(lat1) * Math.cos(lat2) * Math.pow((Math.sin((lon1 - lon2) / 2)), 2)));

  let numsegs = 30;//*d*180/Math.PI;
  let f = 0.0;

  let resultArray = [];
  resultArray.push(start);

  for (let i = 1; i <= numsegs; i++) {
    f += 1.0 / numsegs;
    let A = Math.sin((1 - f) * d) / Math.sin(d);
    let B = Math.sin(f * d) / Math.sin(d);
    let x = A * Math.cos(lat1) * Math.cos(lon1) + B * Math.cos(lat2) * Math.cos(lon2);
    let y = A * Math.cos(lat1) * Math.sin(lon1) + B * Math.cos(lat2) * Math.sin(lon2);
    let z = A * Math.sin(lat1) + B * Math.sin(lat2);
    let latr = Math.atan2(z, Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2)));
    let lonr = Math.atan2(y, x);
    let lat = latr * (180 / Math.PI);
    let lon = lonr * (180 / Math.PI);
    let bigCircleCoord = {lat:lat, lng:lon};
    if (!isNaN(bigCircleCoord.lat)) resultArray.push(bigCircleCoord);


  }
  resultArray.push(end);
  return resultArray;
}

newLocationFromPointWithDistanceBearing  (startingPoint, distanceInMiles, bearingInDegrees) {

  let lat1 = startingPoint.lat * Math.PI / 180;
  let lon1 = startingPoint.lng * Math.PI / 180;

  let a = 6378137, b = 6356752.3142, f = 1 / 298.257223563;  // WGS-84 ellipsiod
  let s = distanceInMiles * 1.60934 * 1000;  // Convert to meters
  let alpha1 = bearingInDegrees * Math.PI / 180;
  let sinAlpha1 = Math.sin(alpha1);
  let cosAlpha1 = Math.cos(alpha1);

  let tanU1 = (1 - f) * Math.tan(lat1);
  let cosU1 = 1 / Math.sqrt((1 + tanU1 * tanU1));
  let sinU1 = tanU1 * cosU1;
  let sigma1 = Math.atan2(tanU1, cosAlpha1);
  let sinAlpha = cosU1 * sinAlpha1;
  let cosSqAlpha = 1 - sinAlpha * sinAlpha;
  let uSq = cosSqAlpha * (a * a - b * b) / (b * b);
  let A = 1 + uSq / 16384 * (4096 + uSq * (-768 + uSq * (320 - 175 * uSq)));
  let B = uSq / 1024 * (256 + uSq * (-128 + uSq * (74 - 47 * uSq)));

  let sigma = s / (b * A);
  let sigmaP = 2 * Math.PI;

  let cos2SigmaM = 0.0;
  let sinSigma = 0.0;
  let cosSigma = 0.0;

  while (Math.abs(sigma - sigmaP) > 1e-12) {
    cos2SigmaM = Math.cos(2 * sigma1 + sigma);
    sinSigma = Math.sin(sigma);
    cosSigma = Math.cos(sigma);
    let deltaSigma = B * sinSigma * (cos2SigmaM + B / 4 * (cosSigma * (-1 + 2 * cos2SigmaM * cos2SigmaM) - B / 6 * cos2SigmaM * (-3 + 4 * sinSigma * sinSigma) * (-3 + 4 * cos2SigmaM * cos2SigmaM)));
    sigmaP = sigma;
    sigma = s / (b * A) + deltaSigma;
  }

  let tmp = sinU1 * sinSigma - cosU1 * cosSigma * cosAlpha1;
  let lat2 = Math.atan2(sinU1 * cosSigma + cosU1 * sinSigma * cosAlpha1, (1 - f) * Math.sqrt(sinAlpha * sinAlpha + tmp * tmp));
  let lambda = Math.atan2(sinSigma * sinAlpha1, cosU1 * cosSigma - sinU1 * sinSigma * cosAlpha1);
  let C = f / 16 * cosSqAlpha * (4 + f * (4 - 3 * cosSqAlpha));
  let L = lambda - (1 - C) * f * sinAlpha * (sigma + C * sinSigma * (cos2SigmaM + C * cosSigma * (-1 + 2 * cos2SigmaM * cos2SigmaM)));

  let lon2 = lon1 + L;

  // Create a new location for this point
  let edgePoint = {lat: lat2 * 180 / Math.PI, lng: lon2 * 180 / Math.PI};

  return edgePoint;
}

bigCircleAzimuth(point1, point2) {
  let lat1 = point1.lat * Math.PI / 180;
  let lon1 = point1.lng * Math.PI / 180;
  let lat2 = point2.lat * Math.PI / 180;
  let lon2 = point2.lng * Math.PI / 180;
  const dLon = (lon2-lon1);
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x = Math.cos(lat1)* Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2)* Math.cos(dLon);
  return Math.atan2(y, x) / (Math.PI / 180);

}
}
