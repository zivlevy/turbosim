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

import {ModalModule} from 'ng2-modal';
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


const routes: Routes = [
    {path: 'planner', component: PlannerComponent},
    {path: 'main-view', component: MainviewComponent}
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
        MapButtonsComponent
    ],
    imports: [
        BrowserModule,
        FormsModule,
        HttpModule,
        RouterModule.forRoot(routes, {useHash: true, initialNavigation: false}),
        JsonpModule,
        ReactiveFormsModule,
        ModalModule
    ],
    providers: [
        MapService,
        AirportService,
        GeoHelperService,
        SimulatorService,
        ScenarioService,
        SimroutesService],
    bootstrap: [AppComponent]
})
export class AppModule {
}
