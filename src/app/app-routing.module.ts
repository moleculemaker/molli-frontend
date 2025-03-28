import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { ConfigurationComponent } from './components/molli/configuration/configuration.component';
import { ResultsComponent } from './components/molli/results/results.component';

import { LandingPageComponent } from './components/landing-page/landing-page.component';

const routes: Routes = [
  { path: 'configuration', component: ConfigurationComponent },
  { path: 'results', component: ResultsComponent },
  { path: 'results/:jobId', component: ResultsComponent },
  { path: '', component: LandingPageComponent }
  // { path: '', component: LandingPageComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
