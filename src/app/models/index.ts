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

export interface LibraryResults {
  generatedStructures: GeneratedStructure[];
  clusteringData: { [clusteringMode: string]: ClusteringData };
}

export interface GeneratedStructure {
  name: string;
  core: string; // TODO not multiple, right?
  substituent: string; // TODO multiple?
  some_kind_of_structure_info: null; // TODO figure out what's needed
}

export interface ClusteringData {
  coordinates: {
    "0": { [structureName: string]: number },
    "1": { [structureName: string]: number }
  };
  clusterAssignments: {
    [numberOfClusters: string]: { [structureName: string]: number }
  }
  exemplars: string[][];
}

