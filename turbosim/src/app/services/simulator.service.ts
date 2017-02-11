import {Injectable} from '@angular/core';
import * as Rx from 'rxjs';
import {isNullOrUndefined} from "util";

@Injectable()
export class SimulatorService {
    simSpeed: number;
    simTick: Rx.Subject<any>;
    simdata :{isPause:boolean} = {isPause:true};
    todos :number[] = [1,2,3,4];

    private static instance: SimulatorService = null;

    constructor() {
        if (! SimulatorService.instance) {
            SimulatorService.instance = this;

        }
        let ticker = Rx.Observable.interval(10);
        this.simSpeed = 100;

        this.simTick = new Rx.Subject();

        ticker.subscribe((tick) => {
            if (!this.simdata.isPause){
                if (tick % this.simSpeed === 0) {
                    this.simTick.next(tick);
                }
            }

        })

        return  SimulatorService.instance;
    }

    setNumber (num:number){
        this.todos.push (num);
    }
    toggleSimulatorPause(){
        this.simdata.isPause = !this.simdata.isPause;



    }
    getSimTicker() {
        return this.simTick;
    }

    setTimeTickSpeed(speed: number) {
        if (speed > 8)  return;
        switch (speed) {
            case 1:
                this.simSpeed = 100;
                break;
            case 2:
                this.simSpeed = 50;
                break;
            case 3:
                this.simSpeed = 25;
                break;
            case 4:
                this.simSpeed = 12;
                break;
            case 5:
                this.simSpeed = 6;
                break;
            case 6:
                this.simSpeed = 3;
                break;
            case 7:
                this.simSpeed = 2;
                break;
            case 8:
                this.simSpeed = 1;
                break;

        }

    }

}
