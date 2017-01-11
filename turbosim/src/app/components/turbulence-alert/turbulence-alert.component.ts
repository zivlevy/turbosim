import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'turbulence-alert',
  templateUrl: './turbulence-alert.component.html',
  styleUrls: ['./turbulence-alert.component.css']
})
export class TurbulenceAlertComponent implements OnInit {
  topAlertBoxColor: string;
  buttomAlertBoxColor: string;
  constructor() { }

  ngOnInit() {

    this.topAlertBoxColor = 'lightblue';
    this.buttomAlertBoxColor = 'red';

  }

}
