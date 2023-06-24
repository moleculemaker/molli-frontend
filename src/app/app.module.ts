import { APP_INITIALIZER, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { NgxMatomoTrackerModule } from '@ngx-matomo/tracker';
import { NgxMatomoRouterModule } from '@ngx-matomo/router';
import { NgHcaptchaModule } from 'ng-hcaptcha';

import { AvatarModule } from 'primeng/avatar';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { ChipModule } from 'primeng/chip';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { FileUploadModule } from 'primeng/fileupload';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { MenuModule } from "primeng/menu";
import { MessagesModule } from 'primeng/messages';
import { MultiSelectModule } from 'primeng/multiselect';
import { OverlayPanelModule } from 'primeng/overlaypanel';
import { PanelModule } from 'primeng/panel';
import { ProgressBarModule } from 'primeng/progressbar';
import { RadioButtonModule } from 'primeng/radiobutton';
import { SelectButtonModule } from 'primeng/selectbutton';
import { SkeletonModule } from 'primeng/skeleton';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ClusterElbowPlotComponent } from './components/molli/cluster-elbow-plot/cluster-elbow-plot.component';
import { ClusterScatterplotComponent } from './components/molli/cluster-scatterplot/cluster-scatterplot.component';
import { ConfigurationComponent} from './components/molli/configuration/configuration.component';
import { LandingPageComponent} from './components/landing-page/landing-page.component';
import { Molecule3dComponent } from './components/molli/molecule3d/molecule3d.component';
import { ResultsComponent } from './components/molli/results/results.component';
import { StructureFileUploadComponent} from './components/molli/structure-file-upload/structure-file-upload.component';

import { EnvironmentService } from "./services/environment.service";

const initAppFn = (envService: EnvironmentService) => {
  return () => envService.loadEnvConfig('/assets/config/envvars.json');
};

@NgModule({
  declarations: [
    AppComponent,
    ClusterElbowPlotComponent,
    ClusterScatterplotComponent,
    ConfigurationComponent,
    LandingPageComponent,
    Molecule3dComponent,
    ResultsComponent,
    StructureFileUploadComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    FormsModule,
    HttpClientModule,
    AvatarModule,
    ButtonModule,
    CheckboxModule,
    ChipModule,
    DialogModule,
    DropdownModule,
    InputTextareaModule,
    FileUploadModule,
    MessagesModule,
    MenuModule,
    MultiSelectModule,
    OverlayPanelModule,
    PanelModule,
    ProgressBarModule,
    SelectButtonModule,
    SkeletonModule,
    RadioButtonModule,
    TableModule,
    TooltipModule,
    NgxMatomoTrackerModule.forRoot({
      siteId: 4,
      trackerUrl: 'https://matomo.mmli1.ncsa.illinois.edu/'
    }),
    NgxMatomoRouterModule,
    NgHcaptchaModule.forRoot({
      siteKey: '0b1663cb-26b9-4e6f-bfa9-352bdd3aeb9f',
      languageCode: 'en' // optional, will default to browser language
  })
  ],
  providers: [
    EnvironmentService,
    {
      provide: APP_INITIALIZER,
      useFactory: initAppFn,
      multi: true,
      deps: [EnvironmentService],
    },],
  bootstrap: [AppComponent]
})
export class AppModule { }
