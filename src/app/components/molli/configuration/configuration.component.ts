import {Component, NgZone} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Router} from '@angular/router';
import {switchMap} from 'rxjs/operators';

import {Message} from 'primeng/api';
import {NgHcaptchaService} from "ng-hcaptcha";

import {BackendService, ExampleKey} from 'src/app/services/backend.service';
import {TrackingService} from 'src/app/services/tracking.service';
import {UserInfoService} from "src/app/services/user-info.service";

@Component({
  selector: 'app-configuration',
  templateUrl: './configuration.component.html',
  styleUrls: ['./configuration.component.scss']
})
export class ConfigurationComponent {
  userEmail: string;
  subscribeToEmail: boolean;

  disableCopyPaste = false; // can disable new jobs if traffic exceeds capacity
  hasBackendError = false;
  highTrafficMessages: Message[]; // TODO later: clean up messages code
  jobFailedMessages: Message[];

  inputMethods = [
    { label: 'Upload 2 Files', icon: 'pi pi-cloud-upload', value: 'copy_and_paste' },
    { label: 'Select an Example', icon: 'pi pi-table', value: 'use_example' },
  ];
  selectedInputMethod: any | null = 'copy_and_paste'; //this.inputMethods[0];

  fileUploadArray: any[] = []; //master list of files needing to be uploaded to the server (and stores results once completed)
  selectedFileToReview: any|null = null;

  constructor(
    private router: Router,
    private httpClient: HttpClient,
    private backendService: BackendService,
    private hcaptchaService: NgHcaptchaService,
    private trackingService: TrackingService,
    private userInfoService: UserInfoService,
    private ngZone: NgZone
  ) { }

  ngOnInit() {
    // If user is logged in, populate email field automatically
    const userInfo = this.userInfoService.userInfo;
    if (userInfo) {
      this.userEmail = userInfo.email;
    }
    this.getExampleData();
    this.highTrafficMessages = [
      { severity: 'info', detail: 'Due to the overwhelming popularity of the Molli tool, we are temporarily unable to generate new libraries. As we increase our capacity, please feel free to explore the tool with the example data we have provided, and visit us again soon!' },
    ];
    this.jobFailedMessages = [
      { severity: 'error', detail: ''}
    ];

/*
      {type: 'core', status: 'processing', status_details: 'Checking for structures...', uploadedFile: {
        name: 'test.txt', size: 22
      }, results: [
        {label: 'YYYYY', warning: 'Duplicate Names: All of them will be deleted automatically for better results.'},
        {label: 'YYYYY', warning: 'Duplicate Names: All of them will be deleted automatically for better results.'},
        {label: 'AAAAA'},
        {label: 'BBBBB'},
        {label: 'CCCCC'},
        {label: 'DDDDD'},
        {label: 'EEEEE'},
        {label: 'FFFFF'},
      ]},
*/
    this.fileUploadArray = [
      {type: 'core', status: 'processing', status_details: 'Checking for structures...', uploadedFile: null},
      {type: 'substituent', status: 'processing', status_details: 'Checking for structures...', uploadedFile: null},
    ];
  }

  getExampleData() {
    // TODO FIXME
  }

  selectExample() {
    // TODO FIXME
    // this.trackingService.trackSelectExampleData(this.selectedExample.label);
  }

  onUploadedFile(uploadedFile:any, file:any) {
    file.uploadedFile = uploadedFile;

//todo: change this to real data
    file.results = [
      {label: 'YYYYY', warning: 'Duplicate Names: All of them will be deleted automatically for better results.'},
      {label: 'YYYYY', warning: 'Duplicate Names: All of them will be deleted automatically for better results.'},
      {label: 'AAAAA'},
      {label: 'BBBBB'},
      {label: 'CCCCC'},
      {label: 'DDDDD'},
      {label: 'EEEEE'},
      {label: 'FFFFF'},
    ];
  }

  hasAnyFileBeenUploaded():boolean {
//todo: determine if we need this feature or not
return true;

    return this.fileUploadArray.find(obj=>{
      return (obj.uploadedFile) ? true : false;
    });
  }

  reviewResults(file:any) {
    this.selectedFileToReview = file;
  }

  submitData() {
    // if the user uses example file, return precompiled result
    // else send sequence to backend, jump to results page
    if (this.selectedInputMethod == 'use_example') {
      this.backendService.getExampleJobPostResponse(ExampleKey.NEW_ENV)
        .subscribe(
          (data) => {
            this.router.navigate(['/results', data.jobId]);
          }
        );
    } else if (this.userInfoService.userInfo) {
      // User is logged in, send token cookie with request
      this.backendService.submitJob(null, this.userEmail.trim()).subscribe(
        (data) => this.router.navigate(['/results', data.jobId]),
        (error) => this.handleJobSubmissionError(error)
      );
    } else {
      // User not logged in, send through hcaptcha
      this.hcaptchaService.verify().pipe(
        switchMap((token) => this.backendService.submitJob(null, this.userEmail.trim(), token))
      ).subscribe(
        (data) => this.router.navigate(['/results', data.jobId]),
        (error) => this.handleJobSubmissionError(error)
      );
    }
  }

  handleJobSubmissionError(error: any): void {
    this.ngZone.run(() => {
      console.error('Error getting contacts via subscribe() method:', error.error.message);
      this.hasBackendError = true;
      this.jobFailedMessages[0].detail = 'Job failed due to ' + error.error.message + '. Please try again, or click the feedback link at the bottom of the page to report a problem.'
    });
  }

  subscribeMailingList() {
    if (this.subscribeToEmail) {
      this.backendService.addEmail(this.userEmail).subscribe(() => {});
    } else {
      this.backendService.removeEmail(this.userEmail).subscribe(() => {});
    }
  }

}
