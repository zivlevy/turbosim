import { Component, OnInit, Output ,EventEmitter} from '@angular/core';

@Component({
  selector: 'map-buttons',
  templateUrl: './map-buttons.component.html',
  styleUrls: ['./map-buttons.component.css']
})
export class MapButtonsComponent implements OnInit {
  elevationButtons: Array<any> = [];

  @Output() altitudeselected: EventEmitter<any> = new EventEmitter();

  currentAltLevel : number=0; //the level of the plane in [0,1,2,3,4];
  selectedButton: number = -1;
  constructor() { }

  ngOnInit() {
    this.elevationButtons.push({id: 4, text: '38-40'});
    this.elevationButtons.push({id: 3, text: '36-38'});
    this.elevationButtons.push({id: 2, text: '34-36'});
    this.elevationButtons.push({id: 1, text: '32-34'});
    this.elevationButtons.push({id: 0, text: '30-32'});
    this.elevationButtons.push({id: -1, text: 'All'});
  }

  altitude_clicked(buttonId) {
    this.altitudeselected.emit(buttonId);
    this.selectedButton = buttonId;
  }

}
