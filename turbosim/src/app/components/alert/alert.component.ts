import {Component, ContentChild, OnInit} from '@angular/core';
import {RadarComponent} from "../radar/radar.component";

@Component({
  selector: 'alert',
  templateUrl: './alert.component.html',
  styleUrls: ['./alert.component.css']
})
export class AlertComponent implements OnInit {
  public visible = false;
  private visibleAnimate = false;
  private modalLeft: string;
  private modalTop: string;
  @ContentChild('radar') contentChild: RadarComponent

  constructor() { }

  ngOnInit() {
    console.log('alert show')
  }

  public show(left: number, top: number): void {
    this.modalLeft = left + 'px';
    this.modalTop = top + 'px';
    this.visible = true;
    setTimeout(() => this.visibleAnimate = true);
    this.contentChild.reset();
  }

  public hide(): void {
    this.visibleAnimate = false;
    setTimeout(() => this.visible = false, 100);
  }

  preventClose(e) {
    e.preventDefault();
    e.stopPropagation();
  }

}
