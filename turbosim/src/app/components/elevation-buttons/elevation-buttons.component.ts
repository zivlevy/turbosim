import {Component, OnInit, Output, Input, EventEmitter, SimpleChanges} from '@angular/core';
import {isUndefined} from "util";

@Component({
    selector: 'elevation-buttons',
    templateUrl: './elevation-buttons.component.html',
    styleUrls: ['./elevation-buttons.component.css']
})
export class ElevationButtonsComponent implements OnInit {
    elevationButtons: Array<any> = [];

    @Output() altitudeselected: EventEmitter<any> = new EventEmitter();
    @Output() autoAltChanged : EventEmitter<any> = new EventEmitter();

    @Input() currentAltitude : number = 0; // the altitude of the plane;
    isAuto: boolean = false;
    currentAltLevel : number=0; //the level of the plane in [0,1,2,3,4];
    selectedButton: number = 1;

    constructor() {
        this.elevationButtons.push({id: 4, text: '38-39'});
        this.elevationButtons.push({id: 3, text: '36-37'});
        this.elevationButtons.push({id: 2, text: '34-35'});
        this.elevationButtons.push({id: 1, text: '32-33'});
        this.elevationButtons.push({id: 0, text: '30-31'});





    }

    ngOnInit() {
        this.autoAltChanged.emit(this.isAuto);
    }
    ngOnChanges(changes: SimpleChanges) {
        for (let propName in changes) {
            let chng = changes[propName];
            if (propName ==='currentAltitude' && this.isAuto) {
                this.currentAltLevel = (Math.floor((chng.currentValue - 30000) /2000));
                this.selectedButton = this.currentAltLevel;
                this.altitudeselected.emit(this.currentAltLevel);
                if (!isUndefined( this.elevationButtons[this.currentAltLevel])) {
                    this.setButtonsText();
                }

            }
       }
    }
    altitude_clicked(buttonId) {
        this.altitudeselected.emit(buttonId);
        this.selectedButton = buttonId;
    }

    autoAltToggle(e){
        this.isAuto = e;
        this.currentAltLevel = (Math.floor((this.currentAltitude - 30000) /2000));
        this.altitudeselected.emit(this.currentAltLevel);
        this.selectedButton = this.currentAltLevel;
        this.setButtonsText();
        this.autoAltChanged.emit(this.isAuto);
    }

    setButtonsText(){
        for (let i=0;i < this.elevationButtons.length;i++){
            if (this.isAuto) {
                this.elevationButtons[i].text = (4- i-  this.currentAltLevel ) *2000;

            } else {
                this.elevationButtons[i].text = (38 - i*2) + '-' + (39 - i*2);

            }
        }

    }

}
