import {Injectable} from "@angular/core";

@Injectable()
export class Globals {
    get appVersion (): string {
        return '1.0.0';
    }
}
