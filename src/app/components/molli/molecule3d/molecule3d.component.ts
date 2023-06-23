import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  ViewChild
} from "@angular/core";
import { ThreedmolLoaderService } from "src/app/services/threedmol-loader.service";
import { combineLatest, BehaviorSubject, Subscription } from "rxjs";
import { filter, first, map } from "rxjs/operators";

@Component({
  selector: 'app-molecule3d',
  templateUrl: './molecule3d.component.html',
  styleUrls: ['./molecule3d.component.scss']
})
export class Molecule3dComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input()
  mol2data: string;

  @Input()
  mode: 'line'|'stick' = 'line';

  @ViewChild("molContainer", { read: ElementRef })
  container: ElementRef<HTMLDivElement>;

  mol2data$ = new BehaviorSubject<string|null>(null);
  subscriptions: Subscription[] = [];

  constructor(
    private $3dMolLoaderService: ThreedmolLoaderService
  ) { }

  ngAfterViewInit(): void {
    const viewer$ = this.$3dMolLoaderService.get3DMol().pipe(
      first(),
      map($3dmol => $3dmol.createViewer(this.container.nativeElement, {} ))
    );
    combineLatest([viewer$, this.mol2data$]).pipe(
      filter(([viewer, data]) => !!data && data.length > 0)
    ).subscribe(([viewer, data]) => this.renderMolecule(viewer, data!));
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.mol2data$.next(this.mol2data);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  renderMolecule(viewer: any, data: string): void {
    viewer.clear();
    viewer.addModel(data, 'mol2');
    if (this.mode === 'line') {
      viewer.setStyle({}, { line: {}});
    } else {
      viewer.setStyle({}, { stick: {}});
    }
    viewer.zoomTo();
    viewer.render();
    // previously had viewer.zoom(0.8, 2000); for dramatic effect; could restore if adding single-molecule 3d viewer
  }
}
