import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Molecule2dComponent } from './molecule2d.component';

describe('Molecule2dComponent', () => {
  let component: Molecule2dComponent;
  let fixture: ComponentFixture<Molecule2dComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ Molecule2dComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Molecule2dComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
