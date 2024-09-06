import {Component, NgZone} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Router} from '@angular/router';
import {switchMap, take} from 'rxjs/operators';

import {Message} from 'primeng/api';
import {NgHcaptchaService} from "ng-hcaptcha";

import {BackendService, ExampleKey} from 'src/app/services/backend.service';
import {TrackingService} from 'src/app/services/tracking.service';
import {UserInfoService} from "src/app/services/user-info.service";
import {FormControl, FormGroup, Validators} from "@angular/forms";
import {catchError, of} from "rxjs";
import {FilesService, JobsService} from "../../../api/mmli-backend/v1";

@Component({
  selector: 'app-configuration',
  templateUrl: './configuration.component.html',
  styleUrls: ['./configuration.component.scss']
})
export class ConfigurationComponent {
  get userInfo() {
    return this.userInfoService.userInfo;
  }

  userEmail: string = '';
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
  exampleFileArray: any[] = []; //master list of files for example case
  selectedFileToReview: any|null = null;

  jobId = '';

  constructor(
    private router: Router,
    private httpClient: HttpClient,
    private backendService: BackendService,
    private jobsApi: JobsService,
    private hcaptchaService: NgHcaptchaService,
    private trackingService: TrackingService,
    private userInfoService: UserInfoService,
    private ngZone: NgZone,
    private filesApi: FilesService
  ) { }

  ngOnInit() {
    // If user is logged in, populate email field automatically
    this.userInfo.pipe(take(1)).subscribe((userInfo) => {
      this.userEmail = userInfo?.email || '';
    });
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
      {type: 'core', status: 'processing', status_details: 'Ready for execution', uploadedFile: null},
      {type: 'substituent', status: 'processing', status_details: 'Ready for execution', uploadedFile: null}
    ];
    this.exampleFileArray = [
      {type: 'core', status: 'success', status_details: 'Ready for execution', uploadedFile: {name: 'cores_example1.cdxml', size: 36742}},
      {type: 'substituent', status: 'success', status_details: 'Ready for execution', uploadedFile: {name: 'substituents_example1.cdxml', size: 33088}}
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

    this.filesApi.uploadFileBucketNameUploadPost('molli', file.uploadedFile, this.jobId).subscribe((resp) => {
      if (!this.jobId) {
        this.jobId = resp.jobID;
      }
    }, (err) => console.error(err));

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
      return this.backendService.getExampleJobPostResponse(ExampleKey.EXAMPLE1)
        .subscribe(
          (data) => {
            this.router.navigate(['/results', data.jobId]);
          }
        );
    } else {
      const data = this.parseUserInput();
      console.log(`Submitting MOLLI job:`, data);
      //this.backendService.submitJob(data.cores, data.subs, this.userEmail.trim(), this.jobId);
      return this.jobsApi.createJobJobTypeJobsPost('molli', {
        job_id: this.jobId,
        run_id: '',   // TODO: support multiple runs?
        job_info: `{\"CORES_FILE_NAME\":\"${data.cores.name}\",\"SUBS_FILE_NAME\":\"${data.subs.name}\"}`,
        email: this.userEmail.trim(),
      }).subscribe(
        (data) => {
          this.router.navigate(['/results', this.jobId]);
        }
      );
    }
  }

  parseUserInput() {
    const cores = this.fileUploadArray[0].uploadedFile;
    const subs = this.fileUploadArray[1].uploadedFile;

    return { cores, subs };
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
