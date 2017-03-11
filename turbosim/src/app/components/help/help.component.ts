import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'help',
  templateUrl: 'help.component.html',
  styleUrls: ['help.component.css']
})
export class HelpComponent implements OnInit {
  public visible = false;
  private visibleAnimate = false;
  private modalLeft: string;
  private modalTop: string;



  constructor() {
  }

  ngOnInit() {

  }


  public show(): void {
    console.log('show help');
    this.visible = true;
    setTimeout(() => this.visibleAnimate = true);
  }

  public hide(): void {
    this.visibleAnimate = false;
    setTimeout(() => this.visible = false, 100);
  }

  preventClose(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  closeClicked(){
    this.hide();
  }

}