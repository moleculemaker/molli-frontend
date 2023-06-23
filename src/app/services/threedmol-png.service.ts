import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { first, map } from "rxjs/operators";

import { ThreedmolLoaderService } from "src/app/services/threedmol-loader.service";

@Injectable({
  providedIn: "root"
})
export class ThreedmolPngService {

  viewer$: Observable<any>;
  constructor(
    private threedmolLoaderService: ThreedmolLoaderService
  ) {
    const container = document.getElementById('threedmol-container');
    this.viewer$ = this.threedmolLoaderService.get3DMol().pipe(
      first(),
      map($3dmol => $3dmol.createViewer(container, { } ))
    );
  }

  getPng(mol2data: string, mode: 'line'|'stick'): Observable<string> {
    return this.viewer$.pipe(
      map(viewer => {
        viewer.clear();
        viewer.addModel(mol2data, 'mol2');
        if (mode === 'line') {
          viewer.setStyle({}, {line: {}});
        } else {
          viewer.setStyle({}, {stick: {}});
        }
        viewer.zoomTo();
        viewer.render();
        console.log(viewer.getCanvas());
        return viewer.pngURI();
      })
    );
  }
}
