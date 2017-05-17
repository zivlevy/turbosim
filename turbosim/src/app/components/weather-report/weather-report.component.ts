import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {MapService} from "../../services/map.service";

@Component({
  selector: 'weather-report',
  templateUrl: './weather-report.component.html',
  styleUrls: ['./weather-report.component.css']
})
export class WeatherReportComponent implements OnInit {
  public visible = false;
  visibleAnimate = false;
  modalLeft: string;
  modalTop: string;
  constructor(private mapService:MapService) { }
  @Input() aircraftLocation: { lat: number, lng: number, heading: number, altitude:number } = {lat: 0, lng: 0, heading: 0, altitude:32};
  @Input() reporttype:string ;

  ngOnInit() {
  }
  public show(left: number, top: number): void {

    this.modalLeft = '70px';
    this.modalTop = top - 50 + 'px';
    this.visible = true;
    setTimeout(() => this.visibleAnimate = true);
  }

  public hide(): void {
    this.visibleAnimate = false;
    setTimeout(() => this.visible = false, 100);
  }

  preventClose(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  submitReport(){

console.log(this.aircraftLocation)

        if (this.reporttype==='freeze'){
          this.mapService.reportFreeze(this.aircraftLocation.lat,this.aircraftLocation.lng,this.aircraftLocation.altitude);
        } else  if (this.reporttype==='wind'){
          this.mapService.reportCrosWind(this.aircraftLocation.lat,this.aircraftLocation.lng,this.aircraftLocation.altitude);
        }
        this.hide();
  }
}
