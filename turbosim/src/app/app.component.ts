import {
    Component,
    trigger,
    state,
    style,
    transition,
    animate
} from '@angular/core';

import {Router} from '@angular/router';
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
                left: 'calc(100% - 240px)',

            })),
            transition('close => open', animate('300ms ease-in')),
            transition('open => close', animate('100ms ease-out'))
        ])
    ]
})
export class AppComponent {
    menuState: string;

    constructor(private router: Router,) {
        this.menuState = 'close';

    }

    ngOnInit() {
        this.router.navigate(['/planner']);


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
