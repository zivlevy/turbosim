import {Injectable} from '@angular/core';
import {Http, Headers} from '@angular/http';
import 'rxjs/add/operator/map';
import {User} from "../classes/user";
import {Observable} from "rxjs";
import {environment} from '../../environments/environment';
import { tokenNotExpired } from 'angular2-jwt';

@Injectable()
export class AuthService {

    authToken: string;
    user: User;
    baseURL: string = environment.turboAreaServer;

    constructor(private http: Http) {

    }

    registerUser(user: User): Observable<any> {
        let headers = new Headers();
        headers.append('Content-Type', 'application/json');
        return this.http.post(this.baseURL + 'users/register/', user, {headers: headers})
            .map(res => res.json());
    }

    loginUser(user: User): Observable<any> {
        return Observable.create((observer) => {
            let headers = new Headers();
            headers.append('Content-Type', 'application/json');
            this.http.post(this.baseURL + 'users/authenticate/', user, {headers: headers})
                .map(res => res.json()).subscribe((res)=>{
                if (res.token) this.saveUserData(res.token,res.user);
                observer.next(res);
            });
        });
    }
    saveUserData(token: string, user:any) {
        localStorage.setItem('id_token', token);
        localStorage.setItem('user', JSON.stringify(user));
        this.user=user;
        this.authToken= token;
    }

    logout(){
        this.user= null;
        this.authToken = null;
        localStorage.clear();
    }

    loggedIn() {
        return tokenNotExpired();
    }
}
