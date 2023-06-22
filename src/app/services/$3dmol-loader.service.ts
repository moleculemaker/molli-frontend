// $3DMol is loaded in index.html; see the other changes included with the commit that introduced this comment
import { Injectable } from "@angular/core";
import { interval, Observable, ReplaySubject } from "rxjs";
import { first } from "rxjs/operators";

declare global {
  interface Window {
    $3Dmol: any;
  }
}

@Injectable({
  providedIn: "root"
})
export class $3DMolLoaderService {
  private $3DMolSubject$: ReplaySubject<any> = new ReplaySubject<any>(1);

  constructor() {
    interval(500).subscribe(() => {
      if (window.$3Dmol) {
        this.$3DMolSubject$.next(window.$3Dmol);
      }
    });
  }

  /**
   * Returns an observable with the $3DMol module in it.
   */
  get3DMol(): Observable<any> {
    return this.$3DMolSubject$.asObservable().pipe(first());
  }
}
