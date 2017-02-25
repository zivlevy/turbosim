import {Component, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {AuthService} from "../../services/auth.service";
import {User} from "../../classes/user";
import {FlashMessagesService} from 'angular2-flash-messages';
@Component({
    selector: 'el-login',
    templateUrl: './login.component.html',
    styleUrls: ['login.component.css']
})
export class LoginComponent implements OnInit {
    user: User = new User();

    constructor(private router: Router,
                private authService: AuthService,
                private flashMessagesService: FlashMessagesService,) {
    }

    ngOnInit() {
    }

    onLoginSubmit() {
        this.authService.loginUser(this.user).subscribe(res => {
            console.log(res);
            if (!res) {
                console.log('User not found');

            } else {
                if (res.success) {
                    this.router.navigate(['/main-view']);
                } else {
                    this.flashMessagesService.show(res.msg, {cssClass: 'alert-danger', timeout: 3000});
                }

            }
        });
    }
}
