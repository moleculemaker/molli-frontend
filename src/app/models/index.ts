export interface JobPostRequest {
  data: null; // TODO FIXME
  user_email: string; // TODO empty string if no entry?
  captcha_token: string;
}

export interface JobPostResponse {
  jobId: string;
  url: string;
  status: string;
  created_at: string;
}

export interface EmailPostRequest {
  email: string;
  captcha_token: string;
}

export interface EmailPostResponse {
  status: string;
  message: string;
}

export interface JobStatus {
  jobId: string;
  url: string;
  status: string;
  created_at: string;
}

export interface JobResult {
  jobId: string;
  url: string;
  status: string;
  created_at: string;
  results: LibraryResults;
}

export interface Structure {
  mol2: string;
  svg: string;
}

export interface LibraryResults {
  clusteringData: { [clusteringMode: string]: ClusteringData };
  structures: { [structureName: string]: Structure };
}

export type ClusterAssignmentObject = { [structureName: string]: number };

export interface ClusteringData {
  coordinates: {
    "0": { [structureName: string]: number },
    "1": { [structureName: string]: number }
  };
  clusterAssignments: {
    [numberOfClusters: string]: ClusterAssignmentObject
  }
  defaultNumberOfClusters: number;
  distortions: number[];
  exemplars: string[][];
}

