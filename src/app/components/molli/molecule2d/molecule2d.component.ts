import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { DomSanitizer, SafeHtml } from "@angular/platform-browser";

@Component({
  selector: 'app-molecule2d',
  templateUrl: './molecule2d.component.html',
  styleUrls: ['./molecule2d.component.scss']
})
export class Molecule2dComponent implements OnChanges {

  @Input()
  svg: string;

  @Input()
  height: number|null;

  @Input()
  width: number|null;

  scaledSvg: SafeHtml;

  constructor(private sanitizer: DomSanitizer) { }

  ngOnChanges(changes: SimpleChanges) {
    let workingSvg = this.svg;
    if (this.height !== null) {
      // replacing just the first instance of height, and for now we assume all heights are originally 200px
      // TODO improve this logic
      workingSvg = workingSvg.replace('height="200px"', 'height="' + this.height + 'px"');
    }
    if (this.width !== null) {
      // replacing just the first instance of width, and for now we assume all widths are originally 200px
      // TODO improve this logic
      workingSvg = workingSvg.replace('width="200px"', 'width="' + this.height + 'px"');
    }
    this.scaledSvg = this.sanitizer.bypassSecurityTrustHtml(workingSvg);
  }
}
