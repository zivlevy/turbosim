import {Component, OnInit ,Input, Output, EventEmitter} from '@angular/core';
import {AirportService} from "../../services/airport.service";
import {Airport} from "../../classes/airport";
@Component({


  selector: 'app-airport-picker',
  templateUrl: './airport-picker.component.html',
  styleUrls: ['./airport-picker.component.css']
})
export class AirportPickerComponent implements OnInit {
  airportService: AirportService;
  airports: Array<Airport>;
  filteredAirports: Array<Airport>;

  public visible = false;
   visibleAnimate = false;
   modalLeft :string;
   modalTop:string;

  @Output() airportSelected = new EventEmitter();

  constructor(airportService: AirportService) {
    this.airportService = airportService;


  }

  ngOnInit() {

    //get airports from service
    this.airportService.getAirports().subscribe((airport: Array<Airport>) => {
      //sort by ICAO
      airport.sort((n1, n2) => {
        if (n1.ICAO > n2.ICAO) return 1;
        if (n1.ICAO < n2.ICAO) return -1;
        return 0;
      });
      this.airports = airport;
      this.filteredAirports = this.airports.slice(0,100);
    })

  }

  onKey(data) {
    this.filteredAirports = this.airports.filter((item,index) => {
      data = data.toLowerCase();
      if (data.length == 0) {
        return index <100 ? true : false;
      }
      if (item.ICAO.substring(0, data.length).toLowerCase() === data ||
        item.city.substring(0, data.length).toLowerCase() === data ||
        item.name.substring(0, data.length).toLowerCase() === data ||
        item.symbol.substring(0, data.length).toLowerCase() === data ||
        item.country.substring(0, data.length).toLowerCase() === data) {
        return true;
      }
      return false;
    });
  }

  airportDblClick(airport) {
    airport.latitude = Number(airport.latitude);
    airport.longitude = Number(airport.longitude);
    this.airportSelected.emit(<Airport>airport);
    this.hide();

  }

  public show(left:number, top:number): void {

    this.modalLeft= left +'px';
    this.modalTop = top +'px';
    this.visible = true;
    setTimeout(() =>this.visibleAnimate = true);
  }

  public hide(): void {
    this.visibleAnimate = false;
    setTimeout(() => this.visible = false, 100);
  }


  searchclicked(e){
    e.preventDefault();
    e.stopPropagation();
  }


}
