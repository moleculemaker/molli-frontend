import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClusterElbowPlotComponent } from './cluster-elbow-plot.component';

describe('ClusterElbowPlotComponent', () => {
  let component: ClusterElbowPlotComponent;
  let fixture: ComponentFixture<ClusterElbowPlotComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ClusterElbowPlotComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ClusterElbowPlotComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
