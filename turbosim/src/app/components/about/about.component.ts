import {Component, OnInit} from '@angular/core';

@Component({
    selector: 'about',
    templateUrl: './about.component.html',
    styleUrls: ['./about.component.css']
})
export class AboutComponent implements OnInit {
    public visible = false;
    private visibleAnimate = false;
    private modalLeft: string;
    private modalTop: string;

    constructor() {
    }

    ngOnInit() {
    }


    public show(left: number, top: number): void {

        this.modalLeft = left + 'px';
        this.modalTop = top + 'px';
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
}
