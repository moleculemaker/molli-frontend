import {APP_INITIALIZER, NgModule} from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { FormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import { ButtonModule } from 'primeng/button';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { PanelModule } from 'primeng/panel';
import { PrimeIcons} from 'primeng/api';
import { ProgressBarModule } from 'primeng/progressbar';
import { SelectButtonModule } from 'primeng/selectbutton';
import { SkeletonModule } from 'primeng/skeleton';
import { TableModule } from 'primeng/table';
import { FileUploadModule } from 'primeng/fileupload';
import { MessagesModule } from 'primeng/messages';
import { CheckboxModule } from 'primeng/checkbox';
import { RadioButtonModule } from 'primeng/radiobutton';
import { DropdownModule } from 'primeng/dropdown';


import { LandingPageComponent} from './components/landing-page/landing-page.component';

import { ConfigurationComponent} from './components/clean/configuration/configuration.component';
import { ResultsComponent } from './components/clean/results/results.component';

import { SequenceService } from './sequence.service';
import { HttpClientModule } from '@angular/common/http';
import { NgxMatomoTrackerModule } from '@ngx-matomo/tracker';
import { NgxMatomoRouterModule } from '@ngx-matomo/router';
import { NgHcaptchaModule } from 'ng-hcaptcha';
import { EnvironmentService } from "./services/environment.service";
import { MenuModule } from "primeng/menu";

const initAppFn = (envService: EnvironmentService) => {
  return () => envService.loadEnvConfig('/assets/config/envvars.json');
};

@NgModule({
  declarations: [
    AppComponent,

    LandingPageComponent,

    ConfigurationComponent,
    ResultsComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    FormsModule,
    MessagesModule,
    ButtonModule,
    InputTextareaModule,
    PanelModule,
    MenuModule,
    ProgressBarModule,
    SelectButtonModule,
    SkeletonModule,
    TableModule,
    FileUploadModule,
    PanelModule,
    BrowserAnimationsModule,
    HttpClientModule,
    CheckboxModule,
    RadioButtonModule,
    DropdownModule,
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
    SequenceService,
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
