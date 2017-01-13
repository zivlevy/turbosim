import {Component, OnInit, Input, Output, EventEmitter} from '@angular/core';

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


    @Input() isMedium: boolean = true;
    @Output() alertLevelSelected = new EventEmitter();
    @Output() alertShowChanged = new EventEmitter();

    constructor() {
    }

    ngOnInit() {
        this.isMedium = true;
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
    turbulenceAlertToggle(e){
        console.log('hrere' + e);
        this.alertShowChanged.emit (e);
    }

    changeAlertLevel(alertLevel) {
        if (alertLevel === 2) {
            this.isMedium = true
        }
        else {
            this.isMedium = false;
        }
console.log(alertLevel);
        this.alertLevelSelected.emit(alertLevel);
    }
}
