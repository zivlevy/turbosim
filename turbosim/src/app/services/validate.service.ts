import { Injectable } from '@angular/core';
import {User} from '../classes/user';

@Injectable()
export class ValidateService {

  constructor() { }

  validateRegister(user:User){
    if (user.name==undefined ||
        user.username==undefined ||
        user.password==undefined ||
        user.email==undefined ) {
      return false;
    } else {
      return true;
    }
  }


  validateEmail(email) {
      const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
      return re.test(email);
    }

}
