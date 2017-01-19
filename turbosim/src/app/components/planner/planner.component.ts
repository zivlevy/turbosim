import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-planner',
  templateUrl: './planner.component.html',
  styleUrls: ['./planner.component.css']
})
export class PlannerComponent implements OnInit {
  selectedScenario:string = "";
  routeChangeDate:number =0;
  constructor() { }

  ngOnInit() {
    this.routeChangeDate = 0;
  }

  scenarioChanged(scenario_id){
    this.selectedScenario = scenario_id;
    console.log(this.selectedScenario);
  }
  routeChanged(e){
    this.routeChangeDate = e;
  }

}
