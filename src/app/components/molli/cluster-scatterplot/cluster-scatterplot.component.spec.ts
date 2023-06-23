import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClusterScatterplotComponent } from './cluster-scatterplot.component';

describe('ClusterScatterplotComponent', () => {
  let component: ClusterScatterplotComponent;
  let fixture: ComponentFixture<ClusterScatterplotComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ClusterScatterplotComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ClusterScatterplotComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
