import { Component, OnInit } from '@angular/core';
import {Globals}  from "../../globals"

@Component({
  selector: 'eo-logo',
  templateUrl: 'logo.component.html',
  styleUrls: ['logo.component.css']
})
export class LogoComponent implements OnInit {
  appVersion:string;

  constructor(private globals:Globals) {
  this.appVersion = globals.appVersion;
}

  ngOnInit() {
  }

}
