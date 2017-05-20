import {
    Component, OnInit, ElementRef, ViewChild, Input, OnChanges, AfterViewInit,
    ViewEncapsulation, EventEmitter, Output
} from '@angular/core';
import {GeoHelperService} from "../../services/geo-helper.service";
import 'fabric';
import {SelectItem} from "primeng/primeng";
import {MapService} from "../../services/map.service";
import {BehaviorSubject} from "rxjs/BehaviorSubject";
import {Subject} from "rxjs/Subject";
import {Observable} from "rxjs/Observable";
declare const fabric: any;

@Component({
    selector: 'radar',
    templateUrl: './radar.component.html',
    styleUrls: ['./radar.component.css'],
    encapsulation: ViewEncapsulation.None,
})
export class RadarComponent implements OnInit,OnChanges,AfterViewInit {
    @Input() aircraftLocation: { lat: number, lng: number, heading: number, altitude:number } = {lat: 0, lng: 0, heading: 0, altitude:32};
    @Input() reporttype:string ;
    @ViewChild('fabric') fabricRef: ElementRef;
    submited$:Subject<null>;
    imgURL:string;
    centerX = 300;
    centerY = 300;
    r = 120;
    scale = 2.2;

    fabricCanvas: any;

    altitudes: SelectItem[];
    selectedAltitude: number;

    isDeleteMode:boolean = false;

    constructor(
        private geoService: GeoHelperService,
        private mapService:MapService
    ) {
        //init altitude select buttons
        this.altitudes = [];
        for (let i:number=29; i < 41 ; i++)
        this.altitudes.push({label:'' + i , value:i});

        this.submited$= new Subject();


    }
ngAfterViewInit(){
    if (this.reporttype==='cloud') this.imgURL='/assets/cloud-icon.png';
    if (this.reporttype==='lightning') this.imgURL='/assets/lightning-icon.png';
    this.fabricRef.nativeElement.width = "600";
    this.fabricRef.nativeElement.height = "380";
    this.fabricCanvas = new fabric.Canvas(this.reporttype);
    this.fabricCanvas.on('mouse:down', (options)=> {
        if (options.target.get('id') !== 'alert-item') {
            this.canvasClicked(options.e)
        }
    });
    this.fabricCanvas.on('mouse:up',(evt)=>{
        if ( ! this.isInRadar(evt.e.offsetX,evt.e.offsetY) && evt.target.get('id') === 'alert-item') {
            this.fabricCanvas.remove(evt.target)
        }
    });
    this.drawRadar();
    this.drawAirplane();
}
    ngOnInit() {


    }


    ngOnChanges(changes){

        console.log(changes)
    }

    drawRadar() {
        for (let i = 20 * this.scale; i <= this.r * this.scale; i += 20 * this.scale) {
            const circle = new fabric.Circle({
                radius: i,
                left: this.centerX,
                top: this.centerY,
                angle: 0,
                startAngle: Math.PI - 0.174533,
                endAngle: 2 * Math.PI + 0.174533,
                stroke: 'white',
                strokeWidth: 0.3,
                fill: '',
                originX: 'center', originY: 'center',
                selectable: false
            });
            this.fabricCanvas.add(circle);
        }
        for (let i = -10; i < 200; i += 10) {
            const x = this.centerX + Math.cos(-i * Math.PI / 180) * this.r * this.scale;
            const y = this.centerY + Math.sin(-i * Math.PI / 180) * this.r * this.scale;

            const line = new fabric.Line(
                [this.centerX, this.centerY, x, y],
                {strokeWidth: 0.2, selectable: false, stroke: 'white'}
            );
            this.fabricCanvas.add(line);
        }

        for (let i = 20; i <= this.r; i += 20) {
            const text = new fabric.Text("" + i + 'm', {
                left: this.centerX, //Take the block's position
                top: this.centerY - i * this.scale  - 6,
                fill: 'white',
                originX: 'center', originY: 'center',
                fontSize:12,
                selectable: false
            })
            this.fabricCanvas.add(text);
        }
    }

    drawAirplane() {
        const myImg = 'assets/airplane@2x.png';
        fabric.Image.fromURL(myImg, (oImg) =>{
            oImg.scale(0.6);
            oImg.set({'left':this.centerX});
            oImg.set({'top':this.centerY});
            oImg.set({'originX':'center'});
            oImg.set({'selectable':false});


            this.fabricCanvas.add(oImg);
        });
    }



    isInRadar(x:number,y:number):boolean {
        const deltaX = this.centerX - x;
        const deltaY = this.centerY - y;
        const rad = Math.atan2(deltaY, deltaX); // In radians
        let deg = rad * (180 / Math.PI);

        //make it angle relative to aircraft nose
        if (deg >= 0) {
            deg = deg - 90;
        } else if (deg < 0 && deg > -90) {
            deg = -90 + deg;
        } else {
            deg = 270 + deg
        }


        //calculate the click distance in miles from aircraft
        const clickedR = (Math.sqrt(deltaY * deltaY + deltaX * deltaX) / this.scale);

        //check if the click is inside the allowd area
        if (!(deg < -100 || deg > 100 || clickedR > this.r)) {
            return  true;
        } else {
            return false;
        }
    }
    canvasClicked(e) {
        // console.log(e)
        const deltaX = this.centerX - e.offsetX;
        const deltaY = this.centerY - e.offsetY;
        const rad = Math.atan2(deltaY, deltaX); // In radians
        let deg = rad * (180 / Math.PI);

        //make it angle relative to aircraft nose
        if (deg >= 0) {
            deg = deg - 90;
        } else if (deg < 0 && deg > -90) {
            deg = -90 + deg;
        } else {
            deg = 270 + deg
        }


        //calculate the click distance in miles from aircraft
        const clickedR = (Math.sqrt(deltaY * deltaY + deltaX * deltaX) / this.scale);

        //check if the click is inside the allowd area
        if (!(deg < -100 || deg > 100 || clickedR > this.r)) {
            const location = {lat: this.aircraftLocation.lat, lng: this.aircraftLocation.lng};
            let clickeWP = this.geoService.newLocationFromPointWithDistanceBearing(location, clickedR, this.aircraftLocation.heading + deg)

            fabric.Image.fromURL(this.imgURL, (oImg) =>{
                oImg.scale(0.2);
                oImg.set({'left':e.offsetX});
                oImg.set({'top':e.offsetY});
                oImg.set({'originX':'center','originY':'center'});
                oImg.set({'selectable':true});
                oImg.set({'id':'alert-item'});
                oImg.set({'hasControls':false});

                this.fabricCanvas.add(oImg);
            });
        }

    }

    init(aircraftLocation){
        console.log(aircraftLocation);
        this.aircraftLocation = aircraftLocation;
        this.selectedAltitude=aircraftLocation.altitude;
        let arr  =this.fabricCanvas.getObjects();
        let toremove =[];
        arr.forEach(item=>{
            if (item.id === 'alert-item') toremove.push(item);
        })
        toremove.forEach(item=>{
            this.fabricCanvas.remove(item);
        })

    }


    /*********************
    API
    *********************/
    submitReport(){
        let arr  =this.fabricCanvas.getObjects();
        let reportedItems =[];
        arr.forEach(item=>{
            if (item.id === 'alert-item') {
                let wp  = this.getWPFromXY(item.left,item.top);
                reportedItems.push(item);
                if (this.reporttype==='cloud'){
                    this.mapService.reportCloud(wp.lat,wp.lng,this.selectedAltitude);
                } else  if (this.reporttype==='lightning'){
                    this.mapService.reportLighning(wp.lat,wp.lng,this.selectedAltitude);
                }

            }
        })
        this.submited$.next();


    }

    getWPFromXY (x:number,y:number) {

        const deltaX = this.centerX - x;
        const deltaY = this.centerY - y;
        const rad = Math.atan2(deltaY, deltaX); // In radians
        let deg = rad * (180 / Math.PI);

        //make it angle relative to aircraft nose
        if (deg >= 0) {
            deg = deg - 90;
        } else if (deg < 0 && deg > -90) {
            deg = -90 + deg;
        } else {
            deg = 270 + deg
        }


        //calculate the click distance in miles from aircraft
        const clickedR = (Math.sqrt(deltaY * deltaY + deltaX * deltaX) / this.scale);
        console.log(clickedR)

        const location = {lat: this.aircraftLocation.lat, lng: this.aircraftLocation.lng};
        let wp = this.geoService.newLocationFromPointWithDistanceBearing(location, clickedR, this.aircraftLocation.heading + deg)
        return wp;
    }

    /*********************
    user actions
    *********************/
    getSubmitted():Observable<null>{
        return this.submited$.asObservable();
    }

}
