import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StructureFileUploadComponent } from './structure-file-upload.component';

describe('StructureFileUploadComponent', () => {
  let component: StructureFileUploadComponent;
  let fixture: ComponentFixture<StructureFileUploadComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ StructureFileUploadComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StructureFileUploadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
