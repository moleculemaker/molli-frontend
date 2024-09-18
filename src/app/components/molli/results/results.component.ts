import { Component, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { timer, Observable, Subscription } from 'rxjs';
import { delayWhen, filter, map, retryWhen, switchMap, tap } from "rxjs/operators";

import { Message, SortEvent } from 'primeng/api';
import { MessageService } from 'primeng/api';

import { ClusterAssignmentObject, ClusteringData, JobResult, JobStatus, SavedMolecule, Structure } from "src/app/models";
import { BackendService } from 'src/app/services/backend.service';
import { Table } from 'primeng/table';
import { UserInfo, UserInfoService } from 'src/app/services/user-info.service';

@Component({
  selector: 'app-results',
  templateUrl: './results.component.html',
  styleUrls: ['./results.component.scss'],
  providers: [MessageService]
})
export class ResultsComponent {
  subscriptions: Subscription[] = [];

  jobId: string;
  status$: Observable<JobStatus>;
  result: JobResult | null = null;

  // TODO later: clean up messages code
  isFailed: boolean = false;
  isExample: boolean = false;
  preComputedMessages: Message[];
  jobFailedMessages: Message[];

  allRows: GeneratedStructureViewModel[] = [];
  filteredRows: GeneratedStructureViewModel[] = [];

  clusteringMethodOptions = [
    { name: 't-SNE(Default)', key: 'tsne' },
    { name: 'PCA', key: 'pca' }
  ];
  clusteringMethod = this.clusteringMethodOptions[0];

  defaultNumberOfClusters: number;
  numberOfClusters: number;
  maxNumberOfClusters: number;

  allCores: string[] = [];
  selectedPoints: string[] = [];
  selectedCores: string[] = []; // note that when filtering, an empty array will be treated as if the user had selected all cores
  allSubstituents: string[] = [];
  selectedSubstituents: string[] = []; // note that when filtering, an empty array will be treated as if the user had selected all substituents

  isStructureDialogOpen = false;
  structureForDialog: GeneratedStructureViewModel|null;

  isClusterSettingDialogOpen = false;

  highlightedPointName: string|null = null;

  @ViewChild('table') table!: Table;
  trHeight = 130;

  downloadOptions = [
    { label: 'Current View', command: () => this.downloadResult('current') },
    { label: 'Complete Results', command: () => this.downloadResult('complete') }
  ];

  userInfo: UserInfo | undefined;
  isShowSavedMoleculesOnly = false;
  savedMolecules: SavedMolecule[] = [];
  savedMoleculeIds: Set<string> = new Set();

  constructor(
    private route: ActivatedRoute,
    private backendService: BackendService,
    private userInfoService: UserInfoService,
    private messageService: MessageService
  ) {
  }

  ngOnInit(): void {
    this.preComputedMessages = [
      { severity: 'info', detail: 'This is a pre-computed result for the example data. To see real-time computation, click the "Run a new Request" button and use the "Copy and Paste" input method.' },
    ];
    this.jobFailedMessages = [
      { severity: 'error', detail: 'Job failed possibly due to incorrect input or intermittent issues. Please use the "Run a new Request" button above to try again, or click the feedback link at the bottom of the page to report a problem.'}
    ]

    const jobId$ = this.route.paramMap.pipe(
      map(paramMap => paramMap.get('jobId'))
    );
    this.subscriptions.push(jobId$.subscribe(
      (jobId) => {
        this.jobId = jobId || 'N/A';
        if (!jobId) {
          this.isFailed;
          this.jobFailedMessages[0].detail = 'The URL does not contain a job id. Please check the link you followed to open this page, or use the "Run a New Request" button above to try again.';
        }
      }
    ));

    // finalStatus$ is an observable of the job status that will only emit a value representing the completed or failed state
    // the implementation polls the backend until the completed or failed state is reached
    const finalStatus$ = jobId$.pipe(
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
      this.backendService.getSavedMolecules(this.jobId).subscribe((result) => {
        this.savedMolecules = result;
        this.savedMoleculeIds = new Set(result.map(molecule => molecule.molecule_id));
      })
    )

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
          const clusteringData = this.getCurrentClusteringData();
          this.defaultNumberOfClusters = clusteringData.defaultNumberOfClusters;
          this.numberOfClusters = this.defaultNumberOfClusters;
          this.maxNumberOfClusters = clusteringData.distortions.length;
          this.allRows = [];
          const currentClusterAssignmentObject = this.getCurrentClusterAssignmentObject();
          Object.entries(result.results.structures).forEach(([name, structureData]) => {
            this.allRows.push(generatedStructureToViewModel(name, structureData, currentClusterAssignmentObject));
          });
          this.updateAllCoresAndSubstituentsAndClearSelections();
          this.isExample = this.backendService.isExampleJob(result.jobId);
          this.selectedPoints = this.allRows.map(row => row.name);
          this.filteredRows = this.allRows;
        },
        (error: JobStatus) => {
          this.isFailed = true;
        }
      )
    );

    this.subscriptions.push(
      this.userInfoService.userInfo.subscribe(userInfo => {
        this.userInfo = userInfo;
      })
    )
  }

  getClusteringDataForMode(mode: ClusteringMode): ClusteringData {
    return this.result!.results.clusteringData[this.clusteringMethod.key];
  }

  getCurrentClusteringData(): ClusteringData {
    // TODO remove? we aren't actually switching between clustering modes as I thought we might be
    // instead, switching between pca and tsne is just updating the coordinates used in the scatterplot, not cluster assignments
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
  onFormChanged(field: 'method'|'number'|'selectedPoints'): void {
    if (field === 'selectedPoints') {
      this.filterTable();
    } else if (field === 'method') {
      this.updateClusterAssignments();
      this.resetTable();
    } else if (field === 'number') {
      this.updateClusterAssignments();
      this.resetTable();
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

  resetFilter() {
    this.selectedCores = [];
    this.selectedSubstituents = [];
    this.isShowSavedMoleculesOnly = false;
    this.filterTable();
  }

  resetTable() {
    this.selectedCores = [];
    this.selectedSubstituents = [];
    this.isShowSavedMoleculesOnly = false;
    this.selectedPoints = this.allRows.map(row => row.name);
    this.filterTable();
  }

  applyAdditionalFilters(row: GeneratedStructureViewModel) {
    // create sets to look up cores and substituents    
    const coreLookup = new Set<string>(this.selectedCores.length === 0 ? this.allCores : this.selectedCores);
    const substituentLookup = new Set<string>(this.selectedSubstituents.length === 0 ? this.allSubstituents : this.selectedSubstituents);
    const saveMoleculesLookup = (row: GeneratedStructureViewModel) => {
      if (!this.isShowSavedMoleculesOnly) {
        return true;
      }
      return this.savedMoleculeIds.has(row.name);
    }
    return coreLookup.has(row.core) && row.substituents.some(subst => substituentLookup.has(subst.label)) && saveMoleculesLookup(row);
  }

  filterTable() {
    this.filteredRows = this.allRows.filter(row => this.selectedPoints.includes(row.name) && this.applyAdditionalFilters(row));
  }

  isPointRestrictedByFilters(pointName: string) {
    const row = this.allRows.find(row => row.name == pointName)!;
    return !this.applyAdditionalFilters(row);
  }

  navigateAndScollToRow(name: string, navigate = false) {
    const index = this.filteredRows.findIndex(row => row.name == name);
    if (navigate) {
      this.table.first = Math.floor(index / this.table.rows) * this.table.rows;
    }

    const scrollRowNum = index - this.table.first;
    if (scrollRowNum >= 0 && scrollRowNum < this.table.rows) {      
      this.table.scrollTo({
        left: 0,
        top: Math.max(scrollRowNum - 1, 0) * this.trHeight,
        behavior: "smooth"
      })
    }
  }

  resetClusterSetting() {
    this.numberOfClusters = this.defaultNumberOfClusters;
    this.clusteringMethod = this.clusteringMethodOptions[0];
  }

  get saveMoleculeToolTip() {
    if (this.isExample && !this.userInfo) {
      return "Sign In to save this molecule";
    }
    return "Save this molecule"
  }

  saveMolecule(row: GeneratedStructureViewModel) {
    if (this.isExample && !this.userInfo) {
      this.userInfoService.login();
      return;
    }
    this.backendService.saveMolecule({
      jobId: this.jobId,
      moleculeId: row.name,
    }).subscribe((res) => {
      this.messageService.add({ severity: 'success', summary: 'Success', detail: res.message });
      this.backendService.getSavedMolecules(this.jobId).subscribe((result) => {
        this.savedMolecules = result;
        this.savedMoleculeIds = new Set(result.map(molecule => molecule.molecule_id));
      })
    }, (error) => {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: error.error.message });
    });
  }

  unSaveMolecule(row: GeneratedStructureViewModel) {
    this.backendService.unSaveMolecule({
     id: this.savedMolecules.find(molecule => molecule.molecule_id == row.name)?.id
    }).subscribe((result) => {
      this.messageService.add({ severity: 'success', summary: 'Success', detail: result.message });
      this.savedMoleculeIds.delete(row.name);
    }, ({ error }) => {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: error.message });
    });
  }

  hideMolecule(row: GeneratedStructureViewModel) {
    const index = this.selectedPoints.findIndex(point => point == row.name);
    this.selectedPoints = [...this.selectedPoints.slice(0, index), ...this.selectedPoints.slice(index + 1)];
    this.filterTable();
  }

  downloadResult(mode: 'current'|'complete'): void {
    const downloadRows: string[][] = [];
    const convertSubstituents = (row: GeneratedStructureViewModel): string => {
      return '"' + row.substituents.map(subst => subst.label).join(',') + '"';
    };
    const convertSvg = (row: GeneratedStructureViewModel): string => {
      return '"' + row.svg.replaceAll('"', '""').replaceAll('\n', '') + '"';
    };
    if (mode === 'current') {
      downloadRows.push(['Generated Name', 'Core', 'Substituents', 'Structure (SVG)', 'Cluster Identifier (k=' + this.numberOfClusters + ')']);
      this.filteredRows.forEach(row => {
        downloadRows.push([row.name, row.core, convertSubstituents(row), convertSvg(row), row.cluster + '']);
      });
    } else {
      const clusterIndices: number[] = [];
      const clusteringData = this.getCurrentClusteringData();
      for (let i = 1; i <= this.maxNumberOfClusters; i++) {
        clusterIndices.push(i);
      }
      downloadRows.push(['Generated Name', 'Core', 'Substituents', 'Structure (SVG)', ...clusterIndices.map(k => 'Cluster Identifier (k=' + k + ')')]);
      this.allRows.forEach(row => {
        downloadRows.push([row.name, row.core, convertSubstituents(row), convertSvg(row), ...clusterIndices.map(k => clusteringData.clusterAssignments[k][row.name] + '')]);
      });
    }

    const csvContent = downloadRows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.download = 'Molli_Result_' + (mode === 'current' ? 'Current_View_' : 'Complete_') + this.jobId + '.csv';

    window.open(url);
    anchor.href = url;
    anchor.click();
    window.URL.revokeObjectURL(url);
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

export interface GeneratedStructureViewModel {
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

function getNamePieces(name: string, separator = '_') {
  return name.split(separator);
}

function generatedStructureToViewModel(name: string, structureData: Structure, clusterAssignments: ClusterAssignmentObject): GeneratedStructureViewModel {
  return {
    name,
    core: getCore(name),
    substituents: getSubtituentArray(name),
    mol2: structureData.mol2,
    svg: structureData.svg,
    cluster: clusterAssignments[name]
  };
}

export function getCore(name: string) {
  const namePieces = getNamePieces(name);
  return namePieces[0];
}

export function getSubtituentArray(name: string): Substituent[] {
  const namePieces = getNamePieces(name).slice(1);
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
