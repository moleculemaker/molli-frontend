import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';

import {
  EmailPostResponse,
  JobPostResponse,
  JobPostRequest,
  JobResult,
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

  submitJob(data: JobFileData, user_email: string, captcha_token: string = ''): Observable<JobPostResponse>{
    const formData = new FormData();

    formData.append('cores', data['cores']);
    formData.append('subs', data['subs']);
    formData.append('user_email', user_email);
    formData.append('captcha_token', captcha_token);


    return this.http.post<JobPostResponse>(`${this.hostname}/${this.apiBasePath}/job/molli`, formData, { withCredentials: true }); //should return a jobID
  }

  getJobStatus(jobId: string): Observable<JobStatus> {
    if (this.isExampleJob(jobId)) {
      return this.getExampleJobStatus(jobId as ExampleKey);
    }
    return this.http.get<JobStatus>(`${this.hostname}/${this.apiBasePath}/job/molli/${jobId}`, { withCredentials: true });
  }

  getJobResult(jobId: string, fileName: string = ''): Observable<JobResult> {
    if (this.isExampleJob(jobId)) {
      return this.getExampleJobResult(jobId as ExampleKey);
    }
    const fileNameParamSuffix = fileName ? `${fileName}}` : '';
    const url = `${this.hostname}/${this.apiBasePath}/job/molli/${jobId}/results/${fileNameParamSuffix}`;
    return this.http.get<JobResult>(url, { withCredentials: true });
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

  getExampleJobStatus(key: ExampleKey): Observable<JobStatus> {
    return of({
      jobId: key,
      url: "mmli.molli.com/jobId/b01f8a6b-2f3e-4160-8f5d-c9a2c5eead78",
      status: "completed", // TODO replace with string enum
      created_at: "2023-06-12 10:10:10"
    });
  }

  getExampleJobResult(key: ExampleKey): Observable<JobResult> {
    return this.http.get<LibraryResults>('assets/' + key + '.json').pipe(
      map((results) => ({
        jobId: key,
        url: "mmli.clean.com/jobId/b01f8a6b-2f3e-4160-8f5d-c9a2c5eead78",
        status: "completed", // TODO replace with string enum
        created_at: "2023-06-12 10:10:10",
        results
      }))
    );
  }

  getSavedMolecules(email: string, jobId: string) {
    // const url = `${this.hostname}/${this.apiBasePath}/molli/saved_molecules?email=${email}&job_id=${this.isExampleJob(jobId) ? "b01f8a6b-2f3e-4160-8f5d-c9a2c5eead78" : jobId}`;
    const url = `${this.hostname}/molli/saved_molecules?email=${email}&job_id=${this.isExampleJob(jobId) ? "b01f8a6b-2f3e-4160-8f5d-c9a2c5eead78" : jobId}`;
    return this.http.get<SavedMolecule[]>(url, { withCredentials: true });
  }

  saveMolecule(data: SaveMoleculeRequest) {    
    const params = {
      email: data.email,
      job_id: this.isExampleJob(data.jobId) ?  "b01f8a6b-2f3e-4160-8f5d-c9a2c5eead78" : data.jobId,
      molecule_id: data.moleculeId
    };
    // return this.http.post<SaveMoleculeResponse>(`${this.hostname}/${this.apiBasePath}/molli/save_molecule`, params, { withCredentials: true });
    return this.http.post<SaveMoleculeResponse>(`${this.hostname}/molli/saved_molecules`, params, { withCredentials: true });
  }

  unSaveMolecule(data: SaveMoleculeRequest) {    
    const params = {
      email: data.email,
      job_id: this.isExampleJob(data.jobId) ?  "b01f8a6b-2f3e-4160-8f5d-c9a2c5eead78" : data.jobId,
      molecule_id: data.moleculeId
    };
    // return this.http.post<SaveMoleculeResponse>(`${this.hostname}/${this.apiBasePath}/molli/save_molecule`, params, { withCredentials: true });
    return this.http.delete<SaveMoleculeResponse>(`${this.hostname}/molli/saved_molecules`, {
        headers: new HttpHeaders({
        'Content-Type': 'application/json',
      }),
      body: params 
    });
  }

}

// TODO add more examples?
export enum ExampleKey {
  EXAMPLE1 = 'example1'
}
