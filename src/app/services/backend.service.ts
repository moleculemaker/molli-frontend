import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';

import {
  EmailPostResponse,
  JobPostResponse,
  JobPostRequest,
  JobResult,
  JobStatus,
  LibraryResults
} from 'src/app/models';
import { EnvVars } from "src/app/models/envvars";
import { EnvironmentService } from "./environment.service";

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

  constructor(private http: HttpClient, private envService: EnvironmentService) {
    this.envs = this.envService.getEnvConfig();
  }

  submitJob(data: null, user_email: string, captcha_token: string = ''): Observable<JobPostResponse>{
    const payload: JobPostRequest = {
      data,
      user_email,
      captcha_token
    };
    return this.http.post<JobPostResponse>(`${this.hostname}/${this.apiBasePath}/job/submit`, payload, { withCredentials: true }); //should return a jobID
  }

  getJobStatus(jobId: string): Observable<JobStatus> {
    if (this.isExampleJob(jobId)) {
      return this.getExampleJobStatus(jobId as ExampleKey);
    }
    return this.http.get<JobStatus>(`${this.hostname}/${this.apiBasePath}/job/status/${jobId}`, { withCredentials: true });
  }

  getJobResult(jobId: string): Observable<JobResult> {
    if (this.isExampleJob(jobId)) {
      return this.getExampleJobResult(jobId as ExampleKey);
    }
    return this.http.get<JobResult>(`${this.hostname}/${this.apiBasePath}/job/results/${jobId}`, { withCredentials: true });
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
      url: "mmli.clean.com/jobId/b01f8a6b-2f3e-4160-8f5d-c9a2c5eead78",
      status: "completed", // TODO replace with string enum
      created_at: "2020-01-01 10:10:10"
    });
  }

  getExampleJobStatus(key: ExampleKey): Observable<JobStatus> {
    return of({
      jobId: key,
      url: "mmli.clean.com/jobId/b01f8a6b-2f3e-4160-8f5d-c9a2c5eead78",
      status: "completed", // TODO replace with string enum
      created_at: "2020-01-01 10:10:10"
    });
  }

  getExampleJobResult(key: ExampleKey): Observable<JobResult> {
    return this.http.get<LibraryResults>('assets/' + key + '.json').pipe(
      map((results) => ({
        jobId: key,
        url: "mmli.clean.com/jobId/b01f8a6b-2f3e-4160-8f5d-c9a2c5eead78",
        status: "completed", // TODO replace with string enum
        created_at: "2020-01-01 10:10:10",
        results
      }))
    );
  }

}

// TODO add more examples?
export enum ExampleKey {
  EXAMPLE1 = 'example1'
}
