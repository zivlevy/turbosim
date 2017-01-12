/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { SimroutesComponent } from './simroutes.component';

describe('SimroutesComponent', () => {
  let component: SimroutesComponent;
  let fixture: ComponentFixture<SimroutesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SimroutesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SimroutesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
