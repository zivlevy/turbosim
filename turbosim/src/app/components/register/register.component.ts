import {Component, OnInit} from '@angular/core';
import {ValidateService} from "../../services/validate.service";
import {AuthService} from "../../services/auth.service";
import {FlashMessagesService} from 'angular2-flash-messages';
import {User} from '../../classes/user';
import  {Router} from '@angular/router';

@Component({
    selector: 'el-register',
    templateUrl: './register.component.html',
    styleUrls: ['register.component.css']
})
export class RegisterComponent implements OnInit {
    name: string;
    username: string;
    email: string;
    password: string;
    role:string = 'user';

    constructor(private validateService: ValidateService,
                private flashMessagesService: FlashMessagesService,
                private authService: AuthService,
                private router: Router) {
    }

    ngOnInit() {
    }

    onRegisterSubmit() {

        const user: User = {
            name: this.name,
            email: this.email,
            username: this.username,
            password: this.password,
            role: this.role

        }
        // Requiered Fields
        if (!this.validateService.validateRegister(user)) {
            this.flashMessagesService.show('Please fill in all fields', {cssClass: 'alert-danger', timeout: 3000});
            return false;
        }

        if (!this.validateService.validateEmail(user.email)) {
            this.flashMessagesService.show('Please use a valid email', {cssClass: 'alert-danger', timeout: 3000});
            return false;
        }

        // Register user
        this.authService.registerUser(user).subscribe(res => {
            console.log(user);
            if (res.success) {
                this.flashMessagesService.show('You are registered', {cssClass: 'alert-success', timeout: 3000});
                this.router.navigate((['/login']));
            } else {
                this.flashMessagesService.show(res.msg, {cssClass: 'alert-danger', timeout: 3000});
                this.router.navigate((['/register']));
            }
        });


    }

}
