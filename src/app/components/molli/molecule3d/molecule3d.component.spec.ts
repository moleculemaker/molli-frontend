import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Molecule3dComponent } from './molecule3d.component';

describe('Molecule3dComponent', () => {
  let component: Molecule3dComponent;
  let fixture: ComponentFixture<Molecule3dComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ Molecule3dComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Molecule3dComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
