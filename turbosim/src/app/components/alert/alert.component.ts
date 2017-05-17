import {AfterContentInit, Component, ContentChild, Input, OnInit} from '@angular/core';
import {RadarComponent} from "../radar/radar.component";

@Component({
    selector: 'alert',
    templateUrl: './alert.component.html',
    styleUrls: ['./alert.component.css']
})
export class AlertComponent implements OnInit, AfterContentInit {
    public visible = false;
    visibleAnimate = false;
    modalLeft: string;
    modalTop: string;
    @ContentChild('radar') contentChild: RadarComponent
    @Input() lat: number;
    @Input() lng: number;
    @Input() heading: number;
    @Input() altitude: number;

    constructor() {

    }

    ngOnInit() {
        console.log('alert show')
    }

    ngAfterContentInit() {
        this.contentChild.getSubmitted().subscribe(() => this.hide())
    }

    public show(left: number, top: number): void {
        if (this.altitude < 29000) return;
        this.modalLeft = left + 'px';
        this.modalTop = top + 'px';
        this.visible = true;
        setTimeout(() => this.visibleAnimate = true);
        //correcrt heading to eliminate minus
        if (this.heading < 0) this.heading = 360 + this.heading;

        this.contentChild.init({lat: this.lat, lng: this.lng, altitude: this.altitude / 1000, heading: this.heading});


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
