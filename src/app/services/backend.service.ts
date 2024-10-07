import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';

import {
  EmailPostResponse,
  JobPostResponse,
  JobPostRequest,
  JobStatus,
  LibraryResults,
  JobFileData,
  SaveMoleculeResponse,
  SaveMoleculeRequest,
  SavedMolecule
} from 'src/app/models';
import { EnvVars } from "src/app/models/envvars";
import { EnvironmentService } from "./environment.service";
import {FormGroup} from "@angular/forms";
import {FilesService, Job, JobsService} from "../api/mmli-backend/v1";

@Injectable({
  providedIn: 'root'
})
export class BackendService {

  private envs: EnvVars;

  get hostname() {    
    return this.envs?.hostname || 'https://jobmgr.mmli1.ncsa.illinois.edu';
  }
  get apiBasePath() {
    return this.envs?.basePath || 'api/v1';
  }
  get mmliHostname() {
    return this.envs?.mmliHostname || 'https://mmli.fastapi.mmli1.ncsa.illinois.edu'
  }

  constructor(private http: HttpClient,
              private envService: EnvironmentService,
              private jobsApi: JobsService,
              private filesApi: FilesService) {

    this.envs = this.envService.getEnvConfig();
  }

  submitJob(cors_file: File, subs_file: File, user_email: string, job_id: string, captcha_token: string = ''): Observable<Job>{
    return this.jobsApi.createJobJobTypeJobsPost('molli', {
      job_id: job_id,
      run_id: '',   // TODO: support multiple runs?
      job_info: `{\"CORS_FILE_NAME\":\"${cors_file.name}\",\"SUBS_FILE_NAME\":\"${subs_file.name}\"}`,
      email: user_email,
    })
    //return this.http.post<JobPostResponse>(`${this.hostname}/${this.apiBasePath}/job/molli`, formData, { withCredentials: true }); //should return a jobID
  }

  getJobStatus(jobId: string): Observable<Array<Job>> {
    if (this.isExampleJob(jobId)) {
      return this.getExampleJobStatus(jobId as ExampleKey) as Observable<any>;
    }
    return this.jobsApi.listJobsByTypeAndJobIdJobTypeJobsJobIdGet('molli', jobId)
    //return this.http.get<JobStatus>(`${this.hostname}/${this.apiBasePath}/job/molli/${jobId}`, { withCredentials: true });
  }

  getJobResult(jobId: string, fileName: string = ''): Observable<string> {
    if (this.isExampleJob(jobId)) {
      return this.getExampleJobResult(jobId as ExampleKey) as Observable<any>;
    }
    //const fileNameParamSuffix = fileName ? `${fileName}}` : '';
    //const url = `${this.hostname}/${this.apiBasePath}/job/molli/${jobId}/results/${fileNameParamSuffix}`;
    //return this.http.get<JobResult>(url, { withCredentials: true });
    return this.filesApi.getResultsBucketNameResultsJobIdGet('molli', jobId);
  }

  addEmail(userEmail: string): Observable<EmailPostResponse>{
    return this.http.post<EmailPostResponse>(`${this.hostname}/${this.apiBasePath}/mailing/add`, {"email": userEmail}, { withCredentials: true });
  }

  removeEmail(userEmail: string): Observable<EmailPostResponse>{
    return this.http.post<EmailPostResponse>(`${this.hostname}/${this.apiBasePath}/mailing/delete`, {"email": userEmail}, { withCredentials: true });
  }

  isExampleJob(jobId: string): boolean {
    return Object.values(ExampleKey).includes(jobId as ExampleKey);
  }

  getExampleJobPostResponse(key: ExampleKey): Observable<JobPostResponse> {
    return of({
      jobId: key,
      url: "mmli.molli.com/jobId/b01f8a6b-2f3e-4160-8f5d-c9a2c5eead78",
      status: "completed", // TODO replace with string enum
      created_at: "2023-06-12 10:10:10"
    });
  }

  getExampleJobStatus(key: ExampleKey): Observable<Job[]> {
    return of([{
      job_id: key,
      //url: "mmli.molli.com/jobId/b01f8a6b-2f3e-4160-8f5d-c9a2c5eead78",
      phase: "completed", // TODO replace with string enum
      time_created: new Date("2023-06-12 10:10:10").getDate()
    }]);
  }

  getExampleJobResult(key: ExampleKey): Observable<LibraryResults> {
    return this.http.get<LibraryResults>('assets/' + key + '.json');
  }

  getSavedMolecules(jobId: string) {
    const url = `${this.mmliHostname}/molli/saved_molecule?job_id=${jobId}`;
    return this.http.get<SavedMolecule[]>(url, { withCredentials: true });
  }

  saveMolecule(data: SaveMoleculeRequest) {
    const params = {
      job_id: data.jobId,
      molecule_id: data.moleculeId
    };
    return this.http.post<SaveMoleculeResponse>(`${this.mmliHostname}/molli/saved_molecule`, params, {
      withCredentials: true 
    });
  }

  unSaveMolecule(data: SaveMoleculeRequest) {    
    return this.http.delete<SaveMoleculeResponse>(`${this.mmliHostname}/molli/saved_molecule`, {
        headers: new HttpHeaders({
        'Content-Type': 'application/json',
      }),
      body: data,
      withCredentials: true
    });
  }

}

// TODO add more examples?
export enum ExampleKey {
  EXAMPLE1 = 'example1'
}
