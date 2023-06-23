import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-structure-file-upload',
  templateUrl: './structure-file-upload.component.html',
  styleUrls: ['./structure-file-upload.component.scss']
})
export class StructureFileUploadComponent {
  @Input() type:string = 'core'; //core OR substituent

  @Output() onUploadedFile = new EventEmitter<any>();

  uploadStructureFile: any|null = null;

  showReviewDialog:boolean = false;

  constructor(
  ) { }

  ngOnInit() {
  }

  onUpload(e:any) {
    this.onUploadedFile.emit(e.files[0]);
  }
}