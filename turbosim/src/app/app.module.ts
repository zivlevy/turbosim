import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {HttpModule, JsonpModule} from '@angular/http';
import {ReactiveFormsModule} from '@angular/forms';
import {RouterModule, Routes} from '@angular/router';

import {AppComponent} from './app.component';
import {MapComponent} from './components/map/map.component';

import {MapService} from './services/map.service';
import {AirportService} from './services/airport.service';
import {GeoHelperService} from './services/geo-helper.service';
import {SimulatorService} from './services/simulator.service';
import {ScenarioService} from "./services/scenario.service";

import {MainviewComponent} from './components/mainview/mainview.component';
import {ToggleComponent} from './components/toggle/toggle.component';
import {AirportPickerComponent} from './components/airport-picker/airport-picker.component';
import {ElevationButtonsComponent} from './components/elevation-buttons/elevation-buttons.component';
import {TurbulenceAlertComponent} from './components/turbulence-alert/turbulence-alert.component';
import {SimroutesComponent} from './components/simroutes/simroutes.component';
import {SimroutesService} from "./services/simroutes.service";
import {AboutComponent} from './components/about/about.component';
import {PlannerComponent} from './components/planner/planner.component';
import {MapButtonsComponent} from './components/map-buttons/map-buttons.component';
import {LoginComponent} from "./components/login/login.component";
import {RegisterComponent} from "./components/register/register.component";
import {LogoComponent} from "./components/logo/logo.component";
import {AuthService} from './services/auth.service';
import {ValidateService} from './services/validate.service';
import {FlashMessagesModule} from 'angular2-flash-messages/module';
import {Globals} from './globals';
import {AuthGuard} from './guards/auth.guard';
import {AdminGuard} from './guards/admin.guard';
import { HelpComponent } from './components/help/help.component';
//prineng
import {BrowserAnimationsModule} from "@angular/platform-browser/animations";
import {SelectButtonModule} from 'primeng/components/selectbutton/selectbutton';
import {ButtonModule} from 'primeng/components/button/button';
//alert input
import { AlertComponent } from './components/alert/alert.component';
import { RadarComponent } from './components/radar/radar.component';
import { WeatherReportComponent } from './components/weather-report/weather-report.component';


const routes: Routes = [
    {path: 'register', component: RegisterComponent},
    {path: 'login', component: LoginComponent},
    {path: 'planner', component: PlannerComponent,canActivate:[AdminGuard]},
    {path: 'main-view', component: MainviewComponent,canActivate:[AuthGuard]}
];

@NgModule({
    declarations: [
        AppComponent,
        MainviewComponent,
        ToggleComponent,
        AirportPickerComponent,
        ElevationButtonsComponent,
        TurbulenceAlertComponent,
        SimroutesComponent,
        AboutComponent,
        MapComponent,
        PlannerComponent,
        MapButtonsComponent,
        LoginComponent,
        RegisterComponent,
        LogoComponent,
        HelpComponent,
        AlertComponent,
        RadarComponent,
        WeatherReportComponent

    ],
    imports: [
        BrowserModule,
        BrowserAnimationsModule,
        FormsModule,
        HttpModule,
        RouterModule.forRoot(routes, {useHash: true, initialNavigation: false}),
        JsonpModule,
        ReactiveFormsModule,
        FlashMessagesModule,
        SelectButtonModule,
        ButtonModule
    ],
    providers: [
        MapService,
        AirportService,
        GeoHelperService,
        SimulatorService,
        ScenarioService,
        SimroutesService,
        AuthService,
        ValidateService,
        Globals,
        AuthGuard,
        AdminGuard
    ],
    bootstrap: [AppComponent]
})
export class AppModule {
}
