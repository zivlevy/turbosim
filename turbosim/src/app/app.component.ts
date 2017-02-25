import {
    Component,
    trigger,
    state,
    style,
    transition,
    animate, OnInit
} from '@angular/core';

import {Router} from '@angular/router';
import {AirportService} from "./services/airport.service";
@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css'],
    animations: [
        trigger('showMenu', [
            state('close', style({
                left: 'calc(100% - 28px)',

            })),
            state('open', style({
                left: 'calc(100% - 180px)',

            })),
            transition('close => open', animate('300ms ease-in')),
            transition('open => close', animate('100ms ease-out'))
        ])
    ]
})
export class AppComponent implements OnInit{
    menuState: string;

    constructor(private router: Router,private airportService:AirportService) {
        this.menuState = 'close';


    }

    ngOnInit() {
        this.router.navigate(['/login']);
    }


    toggleMenu() {

        if (this.menuState === 'open') {
            this.menuState = 'close';
        } else {
            this.menuState = 'open';
        }
    }

    navigateTo(navTarget) {
        this.router.navigate([navTarget]);
        this.toggleMenu();
    }

}
