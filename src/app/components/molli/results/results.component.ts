import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { timer, Observable, Subscription } from 'rxjs';
import { delayWhen, filter, map, retryWhen, switchMap, tap } from "rxjs/operators";

import { Message, SortEvent } from 'primeng/api';

import { ClusterAssignmentObject, ClusteringData, JobResult, JobStatus, Structure } from "src/app/models";
import { BackendService } from 'src/app/services/backend.service';

@Component({
  selector: 'app-results',
  templateUrl: './results.component.html',
  styleUrls: ['./results.component.scss']
})
export class ResultsComponent {
  subscriptions: Subscription[] = [];

  jobId$: Observable<string|null>;
  status$: Observable<JobStatus>;
  result: JobResult | null = null;
  downloadRows: string[][] = [['Identifier', 'Predicted EC Number', 'Confidence Level']];

  // TODO later: clean up messages code
  isFailed: boolean = false;
  isExample: boolean = false;
  preComputedMessages: Message[];
  jobFailedMessages: Message[];

  allRows: GeneratedStructureViewModel[] = [];
  filteredRows: GeneratedStructureViewModel[] = [];

  clusteringMethodOptions = [
    { name: 't-SNE', key: 'tsne' },
    { name: 'PCA', key: 'pca' }
  ];
  clusteringMethod = this.clusteringMethodOptions[0];

  defaultNumberOfClusters: number;
  numberOfClusters: number;
  selectedClusters: number[] = []; // note that when filtering, an empty array will be treated as if the user had selected all clusters

  allCores: string[] = [];
  selectedCores: string[] = []; // note that when filtering, an empty array will be treated as if the user had selected all cores
  allSubstituents: string[] = [];
  selectedSubstituents: string[] = []; // note that when filtering, an empty array will be treated as if the user had selected all substituents

  isStructureDialogOpen = false;
  structureForDialog: GeneratedStructureViewModel|null;

  constructor(
    private route: ActivatedRoute,
    private backendService: BackendService
  ) {
    this.preComputedMessages = [
      { severity: 'info', detail: 'This is a pre-computed result for the example data. To see real-time computation, click the "Run a new Request" button and use the "Copy and Paste" input method.' },
    ];
    this.jobFailedMessages = [
      { severity: 'error', detail: 'Job failed possibly due to incorrect input or intermittent issues. Please use the "Run a new Request" button above to try again, or click the feedback link at the bottom of the page to report a problem.'}
    ]

    this.jobId$ = this.route.paramMap.pipe(
      map(paramMap => paramMap.get('jobId'))
    );
    this.subscriptions.push(this.jobId$.subscribe(
      (jobId) => {
        if (!jobId) {
          this.isFailed;
          this.jobFailedMessages[0].detail = 'The URL does not contain a job id. Please check the link you followed to open this page, or use the "Run a New Request" button above to try again.';
        }
      }
    ));

    // finalStatus$ is an observable of the job status that will only emit a value representing the completed or failed state
    // the implementation polls the backend until the completed or failed state is reached
    const finalStatus$ = this.jobId$.pipe(
      filter(jobId => !!jobId),
      switchMap((jobId) => this.backendService.getJobStatus(jobId!)),
      map((status) => {
        if (status.status !== 'completed' && status.status !== 'failed') {
          throw status; // this will trigger polling via the retryWhen
        }
        return status;
      }),
      retryWhen(errors =>
        errors.pipe(
          tap(status => console.log('Polling...', status)),
          delayWhen(() => timer(5000))
        )
      )
    );

    this.subscriptions.push(
      finalStatus$.pipe(
        switchMap((status: JobStatus) => {
          if (status.status === 'failed') {
            throw status;
          }
          return this.backendService.getJobResult(status.jobId)
        })
      ).subscribe(
        (result) => {
          this.result = result;
          // note the default number of clusters is the same regardless of dimensionality reduction technique
          // in fact, the choice of dimensionality reduction technique will only affect the scatterplot coordinates, not
          // any of the other clustering data
          this.defaultNumberOfClusters = this.getCurrentClusteringData().defaultNumberOfClusters;
          this.numberOfClusters = this.defaultNumberOfClusters;
          this.allRows = [];
          this.selectedClusters = [];
          const currentClusterAssignmentObject = this.getCurrentClusterAssignmentObject();
          Object.entries(result.results.structures).forEach(([name, structureData]) => {
            this.allRows.push(generatedStructureToViewModel(name, structureData, currentClusterAssignmentObject));
          });
          this.updateAllCoresAndSubstituentsAndClearSelections();
          this.isExample = this.backendService.isExampleJob(result.jobId);
          this.filterTable();
        },
        (error: JobStatus) => {
          this.isFailed = true;
        }
      )
    );
  }

  ngOnInit(): void {
  }

  getClusteringDataForMode(mode: ClusteringMode): ClusteringData {
    return this.result!.results.clusteringData[this.clusteringMethod.key];
  }

  getCurrentClusteringData(): ClusteringData {
    return this.getClusteringDataForMode(this.clusteringMethod.key as ClusteringMode);
  }

  getCurrentClusterAssignmentObject(): ClusterAssignmentObject {
    return this.getCurrentClusteringData().clusterAssignments[this.numberOfClusters];
  }

  updateAllCoresAndSubstituentsAndClearSelections(): void {
    const cores = new Set<string>();
    const substituents = new Set<string>();
    this.allRows.forEach(row => {
      cores.add(row.core);
      row.substituents.forEach(subst => {
        substituents.add(subst.label);
      });
    })
    this.allCores = [...cores.values()].sort((a, b) => a.localeCompare(b));
    this.allSubstituents = [...substituents.values()].sort((a, b) => a.localeCompare(b));
    this.selectedCores = [];
    this.selectedSubstituents = [];
  }

  onNumberOfClustersChanged(newNumber: number): void {
    this.numberOfClusters = newNumber;
    this.onFormChanged('number');
  }

  // TODO change form to reactive
  onFormChanged(field: 'method'|'numberMode'|'number'|'selectedClusters'): void {
    if (field === 'selectedClusters') {
      this.filterTable();
    } else if (field === 'method' || field === 'numberMode' || field === 'number') {
      this.selectedClusters = [];
      this.updateClusterAssignments();
      this.filterTable();
    } else {
      console.log('Unknown case' + field);
    }
  }

  updateClusterAssignments(): void {
    const assignments = this.getCurrentClusterAssignmentObject();
    this.allRows.forEach(row => {
      row.cluster = assignments[row.name];
    });
  }

  filterTable() {
    // create an array to look up cluster status
    const clusterLookup: boolean[] = [];
    for (let i = 0; i < this.numberOfClusters; i++) {
      clusterLookup.push(this.selectedClusters.length === 0 || this.selectedClusters.includes(i));
    }
    // create sets to look up cores and substituents
    const coreLookup = new Set<string>(this.selectedCores.length === 0 ? this.allCores : this.selectedCores);
    const substituentLookup = new Set<string>(this.selectedSubstituents.length === 0 ? this.allSubstituents : this.selectedSubstituents);
    this.filteredRows = this.allRows.filter(row => clusterLookup[row.cluster] && coreLookup.has(row.core) && row.substituents.some(subst => substituentLookup.has(subst.label)));
  }

  downloadResult(): void {
    /*
    this.downloadRows = [['Identifier', 'Predicted EC Number', 'Confidence Level']];
    this.filteredResult.forEach(row => {
      // let temp: string[] = [];
      row.ecNumbers.forEach((num, index) => {
        this.downloadRows.push([row.sequence, num,row.level[index]]);
      })
      // this.downloadRows.push(temp);
    });
    // console.log(this.downloadRows);

    let csvContent = this.downloadRows.map(e => e.join(",")).join("\n");
    // console.log(csvContent);
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    var anchor = document.createElement("a");
    anchor.download = 'CLEAN_Result_' + this.sendJobID + '.csv';
    // window.open(url);
    anchor.href = url;
    anchor.click();

     */
  }

  customSort(event: SortEvent) {
    const order = event.order || 1;
    if (event.field === 'name') {
      event.data?.sort((d1,d2) => order * d1[event.field!].localeCompare(d2[event.field!]));
    } else if (event.field === 'core') {
      event.data?.sort((d1,d2) => order * d1[event.field!].localeCompare(d2[event.field!]));
    } else if (event.field === 'substituents') {
      // sort substituents within each row
      this.allRows.forEach(row => {
        row.substituents.sort((s1, s2) => order * s1.label.localeCompare(s2.label));
      });
      // now sort rows by first substituent
      event.data?.sort((d1,d2) => order * d1.substituents[0].label.localeCompare(d2.substituents[0].label));
    } else if (event.field === 'cluster') {
      event.data?.sort((d1,d2) => order * d1[event.field!] - d2[event.field!]);
    }
  }

  copyAndPasteURL(): void {
    const selBox = document.createElement('textarea');
    selBox.style.position = 'fixed';
    selBox.style.left = '0';
    selBox.style.top = '0';
    selBox.style.opacity = '0';
    selBox.value = window.location.href;
    document.body.appendChild(selBox);
    selBox.focus();
    selBox.select();
    document.execCommand('copy');
    document.body.removeChild(selBox);
  }

  openStructureDialog(structure: GeneratedStructureViewModel): void {
    this.structureForDialog = structure;
    this.isStructureDialogOpen = true;
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(s => s.unsubscribe());
  }

}

export interface ClusterSelection {
  name: string;
  value: number;
}

interface GeneratedStructureViewModel {
  name: string;
  core: string;
  substituents: Substituent[];
  mol2: string;
  svg: string;
  cluster: number;
}

interface Substituent {
  label: string;
  count: number;
}

function generatedStructureToViewModel(name: string, structureData: Structure, clusterAssignments: ClusterAssignmentObject): GeneratedStructureViewModel {
  const separator = '_'; // TODO make configurable and/or change
  const namePieces = name.split(separator);
  const core = namePieces.shift()!;
  return {
    name,
    core,
    substituents: namePiecesToSubtituentArray(namePieces),
    mol2: structureData.mol2,
    svg: structureData.svg,
    cluster: clusterAssignments[name]
  };
}

function namePiecesToSubtituentArray(namePieces: string[]): Substituent[] {
  const returnVal: Substituent[] = [];
  const labelToCount = new Map<string, number>();
  namePieces.forEach(label => {
    if (labelToCount.has(label)) {
      labelToCount.set(label, labelToCount.get(label)! + 1);
    } else {
      labelToCount.set(label, 1);
    }
  });
  labelToCount.forEach((count, label) => {
    returnVal.push({label, count});
  });
  return returnVal;
}

type ClusteringMode = 'pca'|'tsne';
