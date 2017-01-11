import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {HttpModule, JsonpModule} from '@angular/http';
import {ReactiveFormsModule} from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';

import {AppComponent} from './app.component';
import {MapComponent} from './components/map/map.component';

import {MapService} from './services/map.service';
import {AirportService} from './services/airport.service';
import {GeoHelperService} from './services/geo-helper.service';
import {SimulatorService} from './services/simulator.service';
import {SimroutesService} from "./services/simroutes.service";

import {ModalModule} from '../../node_modules/ng2-modal';
import {MainviewComponent} from './components/mainview/mainview.component';
import {ToggleComponent} from './components/toggle/toggle.component';
import {AirportPickerComponent} from './components/airport-picker/airport-picker.component';
import { ElevationButtonsComponent } from './components/elevation-buttons/elevation-buttons.component';
import { ScenarioComponent } from './components/scenario/scenario.component';
import { TurbulenceAlertComponent } from './components/turbulence-alert/turbulence-alert.component';




const routes: Routes = [
  { path: 'turbo-editor', component: MapComponent },
  { path: 'main-view', component: MainviewComponent },
  { path: 'scenario', component: ScenarioComponent },
];

@NgModule({
  declarations: [
    AppComponent,
    MapComponent,
    MainviewComponent,
    ToggleComponent,
    AirportPickerComponent,
    ElevationButtonsComponent,
    ScenarioComponent,
    TurbulenceAlertComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpModule,
    RouterModule.forRoot(routes),
    JsonpModule,
    ReactiveFormsModule,
    ModalModule
  ],
  providers: [
    MapService,
    AirportService,
    GeoHelperService,
    SimulatorService,
    SimroutesService],
  bootstrap: [AppComponent]
})
export class AppModule {
}
