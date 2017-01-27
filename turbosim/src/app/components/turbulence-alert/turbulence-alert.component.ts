import {Component, OnInit, Input, Output, EventEmitter} from '@angular/core';

@Component({
    selector: 'turbulence-alert',
    templateUrl: './turbulence-alert.component.html',
    styleUrls: ['./turbulence-alert.component.css']
})
export class TurbulenceAlertComponent implements OnInit {
    @Input() topAlertBoxColor: string;
    @Input() currentAlertBoxColor: string;
    @Input() bottomAlertBoxColor: string;
    @Output() reset: EventEmitter<boolean> = new EventEmitter();

    constructor() {
    }

    ngOnInit() {

    }

    resetclicked(){
        this.reset.emit(true);
    }

}
