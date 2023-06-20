import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { timer, Observable, Subscription } from 'rxjs';
import { delayWhen, filter, map, retryWhen, switchMap, tap } from "rxjs/operators";

import { Message, SortEvent } from 'primeng/api';

import { BackendService } from 'src/app/services/backend.service';
import { GeneratedStructure, JobResult, JobStatus } from "src/app/models";

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

  filteredResult: GeneratedStructure[] = [];
  enableFilter: boolean = false;

  clusteringMethodOptions = [
    { name: 't-SNE (Default)', key: 'tsne' },
    { name: 'PCA', key: 'pca' }
  ];
  clusteringMethod = this.clusteringMethodOptions[0];

  // TODO update number field here
  numberOfClustersModeOptions = [
    { name: 'Elbow Value (Default)', key: 'elbow', number: 7 },
    { name: 'Custom', key: 'custom', number: 6 }
  ];
  numberOfClustersMode = this.numberOfClustersModeOptions[0];

  // TODO update this array based on numberOfClustersMode.number, and clear selectedClusters when numberOfClustersMode.number changes
  clusters: ClusterSelection[] = [
    { name: 'Cluster 0', value: 0 },
    { name: 'Cluster 1', value: 1 },
    { name: 'Cluster 2', value: 2 },
    { name: 'Cluster 3', value: 3 },
    { name: 'Cluster 4', value: 4 }
  ];
  selectedClusters: number[] = [];

  constructor(private route: ActivatedRoute, private backendService: BackendService) {
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
          this.isExample = this.backendService.isExampleJob(result.jobId);
        },
        (error: JobStatus) => {
          this.isFailed = true;
        }
      )
    );
  }

  ngOnInit(): void {
  }

  onTableFiltered(event: SortEvent, sorted: GeneratedStructure[]) {
    // console.log(sorted);
    this.filteredResult = sorted;
  }

  filterResult() {
    this.enableFilter = !this.enableFilter;
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
    /*
    if (event.field == 'sequence') {
      event.data?.sort((d1,d2) => {
        let v1 = d1[event.field!];
        let v2 = d2[event.field!];
        return event.order === -1 ? v1.localeCompare(v2) : v2.localeCompare(v1);
      });
    }
    else if (event.field == 'ecNumbers') {
      event.data?.sort((d1,d2) => {
        let v1 = d1[event.field!][0];
        let v2 = d2[event.field!][0];
        return event.order === -1 ? v1.localeCompare(v2) : v2.localeCompare(v1);
      });
    }
    if (event.field == 'score') {
      if (event.order == 1) {
        // ascending low -> high
        this.rows.forEach((element, index, array) => {
          let tempArray: any[] = [];
          element['score'].forEach((element2, index2) => {
            tempArray.push([element['ecNumbers'][index2], element['score'][index2], element['level'][index2]]);
            // console.log([element['ecNumbers'][index2], element['score'][index2], element['level'][index2]]);
          });
          // console.log('temp = ', tempArray);
          tempArray.sort((a, b) => {
            // console.log(a[1], b[1]);
            if (a[1] < b[1]) {
              return -1;
            }
            if (a[1] > b[1]) {
              return 1;
            }
            return 0;
          });
          array[index]['ecNumbers'] = tempArray.map((subarray) => subarray[0]);
          array[index]['score'] = tempArray.map((subarray) => subarray[1]);
          array[index]['level'] = tempArray.map((subarray) => subarray[2]);
          // console.log(array[index]['level']);
          // console.log(this.rows[index]['level']);
        });
      }
      else {
        // decending high -> low
        this.rows.forEach((element, index, array) => {
          let tempArray: any[] = [];

          element['score'].forEach((element2, index2) => {
            tempArray.push([element['ecNumbers'][index2], element['score'][index2], element['level'][index2]]);
            // console.log([element['ecNumbers'][index2], element['score'][index2], element['level'][index2]]);
          });

          // console.log('temp = ', tempArray);
          tempArray.sort((a, b) => {
            // console.log(a[1], b[1]);
            if (a[1] > b[1]) {
              return -1;
            }
            if (a[1] < b[1]) {
              return 1;
            }
            return 0;
          });
          array[index]['ecNumbers'] = tempArray.map((subarray) => subarray[0]);
          array[index]['score'] = tempArray.map((subarray) => subarray[1]);
          array[index]['level'] = tempArray.map((subarray) => subarray[2]);
          // console.log(array[index]['level']);
          // console.log(this.rows[index]['level']);
        });
      }

      event.data?.sort((d1,d2) => {
        let v1 = d1[event.field!][0];
        let v2 = d2[event.field!][0];
        return event.order === -1 ? v2 - v1 : v1 - v2;
      });
    }


     */
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

  ngOnDestroy(): void {
    this.subscriptions.forEach(s => s.unsubscribe());
  }

}

export interface ClusterSelection {
  name: string;
  value: number;
}
