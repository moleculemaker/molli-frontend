import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { extent } from 'd3-array';
import { ScaleLinear, scaleLinear } from 'd3-scale';

import { ClusteringData } from "../../../models";
import { GeneratedStructureViewModel, getCore, getSubtituentArray } from "../results/results.component";

@Component({
  selector: 'app-cluster-scatterplot',
  templateUrl: './cluster-scatterplot.component.html',
  styleUrls: ['./cluster-scatterplot.component.scss']
})
export class ClusterScatterplotComponent implements OnChanges {

  @Input()
  data?: ClusteringData;

  @Input()
  structureDetails: GeneratedStructureViewModel[];

  @Input()
  numberOfClusters?: number;

  @Input()
  selectedPoints: string[] = [];
  @Output()
  selectedPointsChange = new EventEmitter<string[]>();

  @Input()
  mode: 'tsne'|'pca';

  highlightedClusterIndex: number|null = null;
  
  @Input()
  highlightedPointName: string|null = null;
  @Output()
  highlightedPointNameChange = new EventEmitter<string|null>();

  // check if the point/examplar is restricted to select/unselect by additional filters
  @Input()
  checkRestrict: (name: string) => Boolean;
  
  @Input()
  handleScroll: (name: string, navigate?: boolean) => void;

  lastClickedPointName: string|null = null;

  viewBox = {
    height: 400,
    width: 400
  };

  margins = {
    top: 40,
    right: 40,
    bottom: 40,
    left: 40
  };

  pointRadius = 6;
  points: Point[] = [];
  clusters: Cluster[] = [];

  xScale: ScaleLinear<number, number>;
  yScale: ScaleLinear<number, number>;
  colors = [
    "#6686F6", "#E29D50", "#C95454", "#1DA750", "#47B4D6",
    "#8F48D2", "#CCD005", "#AEC0FF", "#F4C189","#E48F8F", 
    "#76DB9B", "#A2E6F5", "#B975F9", "#909300", "#1F48D6", 
    "#BB772B", "#AD2828", "#136C34", "#268FB0", "#5C2F88"
  ];

  // 0: unselected, 1: selected, 2: partially selected
  allClusterSelected = 1;
  selectedClusterPath = [
    {
      path: "M10.6667 1.33333V10.6667H1.33333V1.33333H10.6667ZM10.6667 0H1.33333C0.6 0 0 0.6 0 1.33333V10.6667C0 11.4 0.6 12 1.33333 12H10.6667C11.4 12 12 11.4 12 10.6667V1.33333C12 0.6 11.4 0 10.6667 0",
      fill: "#DEE2E6"
    },
    {
      path: "M10.6667 0H1.33333C0.593333 0 0 0.6 0 1.33333V10.6667C0 11.4 0.593333 12 1.33333 12H10.6667C11.4067 12 12 11.4 12 10.6667V1.33333C12 0.6 11.4067 0 10.6667 0ZM4.66667 9.33333L1.33333 6L2.27333 5.06L4.66667 7.44667L9.72667 2.38667L10.6667 3.33333L4.66667 9.33333Z",
      fill: "#224063"
    },
    {
      path: "M1.33333 10.6667L1.33333 1.33333L10.6667 1.33333L6 6L1.33333 10.6667ZM1.33333 12L10.6667 12C11.4 12 12 11.4 12 10.6667L12 1.33333C12 0.599999 11.4 -5.24537e-08 10.6667 -1.16564e-07L1.33333 -9.3251e-07C0.6 -9.9662e-07 9.9662e-07 0.599998 9.3251e-07 1.33333L1.16564e-07 10.6667C5.24537e-08 11.4 0.599999 12 1.33333 12Z",
      fill: "#224063"
    }
  ]

  constructor() { 
   
  }

  ngOnInit() {
    this.draw();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes["data"] || changes["numberOfClusters"]) {
      this.draw();
    }
    if (changes["selectedPoints"]) {
      if (this.selectedPoints.length == this.points.length) {
        // Reset-all
        this.points.forEach(point => point.isSelected = true);
        this.clusters.forEach(cluster => cluster.isSelected = 1);
        this.allClusterSelected = 1;
      } else {
        // hide in the table
        this.points.forEach(point => point.isSelected = this.selectedPoints.includes(point.name));
        this.clusters.forEach(cluster => {
          const selectedPointsCntInCluster = this.getSelectedPointsCntInCluster(cluster); 
          if (selectedPointsCntInCluster == 0) {
            cluster.isSelected = 0;
          } else if (selectedPointsCntInCluster == cluster.pointCount) {
            cluster.isSelected = 1;
          } else {
            cluster.isSelected = 2;
          }
        })
        this.onClusterChange();
      }
    }
  }

  draw(): void {
    this.points = [];
    if (this.data && this.numberOfClusters && this.data.clusterAssignments[this.numberOfClusters] && this.structureDetails) {
      // create map from structure name to structure
      const structureNameToStructure = new Map<string, GeneratedStructureViewModel>(this.structureDetails.map(structure => [structure.name, structure]));

      // build data structures to represent clusters
      this.clusters = [];
      for (let i = 0; i < this.numberOfClusters; i++) {
        this.clusters.push({
          exemplar: null as unknown as Point, // we'll fix this in a moment
          index: i,
          color: this.colors[i],
          isSelected: 1,
          pointCount: 0
        });
      }

      // create x scale and y scale
      const xExtent = extent(Object.values(this.data.coordinates['0'])) as [number, number];
      const yExtent = extent(Object.values(this.data.coordinates['1'])) as [number, number];
      this.xScale = scaleLinear().domain(xExtent).range([this.margins.left, this.viewBox.width - this.margins.right]);
      this.yScale = scaleLinear().domain(yExtent).range([this.viewBox.height - this.margins.bottom, this.margins.top]);

      // prepare points for plotting
      this.points = Object.entries(this.data.clusterAssignments[this.numberOfClusters]).map(([name, clusterIndex]) => {
        this.clusters[clusterIndex].pointCount++;
        return {
          x: this.xScale(this.data!.coordinates['0'][name]),
          y: this.yScale(this.data!.coordinates['1'][name]),
          name,
          svg: structureNameToStructure.get(name)!.svg,
          cluster: this.clusters[clusterIndex],
          isSelected: true
        }
      });

      // get exemplars
      const exemplarsForCurrentNumberOfClusters = this.data.exemplars.find(exemplars => exemplars.length === this.numberOfClusters);
      const exemplarNameToClusterIndex = new Map<string, number>(
        exemplarsForCurrentNumberOfClusters!.map((name, index) => [name, index])
      );
      this.points.filter(point => exemplarNameToClusterIndex.has(point.name)).forEach(exemplar => {
        const cluster = this.clusters[exemplarNameToClusterIndex.get(exemplar.name)!];
        cluster.exemplar = exemplar;
      });

      this.allClusterSelected = 1;
    }
  }

  onPointsChange() {
    this.selectedPoints = this.points.filter(point => point.isSelected).map(point => point.name);    
    this.selectedPointsChange.emit(this.selectedPoints);
  }

  onClusterChange() {
    const seletedClusterNum = this.clusters.filter(cluster => cluster.isSelected === 1).length;
    if (seletedClusterNum === 0) {
      this.allClusterSelected = 0;
    }
    if (seletedClusterNum === this.numberOfClusters) {
      this.allClusterSelected = 1;
    }
  }

  toggleAllCluster() {
    this.allClusterSelected = this.allClusterSelected == 1 ? 0 : 1;
    this.clusters.forEach(cluster => cluster.isSelected = this.allClusterSelected);
    this.points.forEach(point => point.isSelected = !!this.allClusterSelected);
    this.onPointsChange();
  }

  toggleCluster(cluster: Cluster): void {
    cluster.isSelected = cluster.isSelected == 1 ? 0 : 1;
    this.points.forEach(point => {
      if (point.cluster.index === cluster.index) {
        point.isSelected = !!cluster.isSelected;
      }
    })
    if (this.allClusterSelected == 2) {
      this.onClusterChange();
    } else {
      this.allClusterSelected = 2;
    }
    this.onPointsChange();
  }

  togglePoint(point: Point) {
    if (this.checkRestrict(point.name)) {
      return;
    }

    // if it's the first time the point is clicked, just scoll to it
    if (point.isSelected && this.lastClickedPointName != point.name) {
      this.lastClickedPointName = point.name;
      setTimeout(() => {
        this.handleScroll(point.name, true);
      });
      return
    }

    // not the first time, toggle point
    point.isSelected = !point.isSelected;
    if (point.cluster.isSelected == 2) {
      const selectedPointsCntInCluster = this.getSelectedPointsCntInCluster(point.cluster);
      if (selectedPointsCntInCluster == 0) {
        point.cluster.isSelected = 0;
        this.onClusterChange();
      }
      if (selectedPointsCntInCluster == point.cluster.pointCount) {
        point.cluster.isSelected = 1;
        this.onClusterChange();
      }
    } else {
      point.cluster.isSelected = 2;
      this.allClusterSelected = 2;
    }
    this.onPointsChange();
    if (point.isSelected) {
      setTimeout(() => {
        this.handleScroll(point.name, true);
      });
    }
  }

  getSelectedPointsCntInCluster(cluster: Cluster) {
    return this.points.filter(point => point.cluster.index === cluster.index && point.isSelected).length;
  }

  highlightCluster(cluster: Cluster): void {    
    this.highlightedClusterIndex = cluster.index;
    this.highlightedPointNameChange.emit(cluster.exemplar.name);
    this.handleScroll(cluster.exemplar.name);
  }
  highlightPoint(point: Point): void {
    this.highlightedClusterIndex = null;
    this.highlightedPointNameChange.emit(point.name);
    this.handleScroll(point.name);
  }
  unhighlight(): void {
    this.highlightedClusterIndex = null;
    this.highlightedPointNameChange.emit(null);
  }

  isPointHighlighted(point: Point) {
    return this.highlightedPointName === point.name ||  this.highlightedClusterIndex === point.cluster.index;
  }
  isPointFaded(point: Point) {
    if (this.highlightedClusterIndex != null) {
      return this.highlightedClusterIndex != point.cluster.index;
    }
    return this.highlightedPointName && this.highlightedPointName != point.name;
  }
  isClusterFaded(cluster: Cluster) {
    return (this.highlightedPointName && this.highlightedPointName !== cluster.exemplar.name) || (this.highlightedClusterIndex != null && this.highlightedClusterIndex !== cluster.index)
  }

  getPointByName(name: string|null) {
    if (name == null) {
      return null;
    }
    return this.points.find(point => point.name == name)!;
  }

  getCore = getCore;
  getSubtituentArray = getSubtituentArray;
}

interface Point {
  x: number;
  y: number;
  name: string;
  svg: string;
  cluster: Cluster;
  isSelected: boolean;
}

interface Cluster {
  index: number;
  exemplar: Point;
  color: string;
  isSelected: number; // 0: unselected, 1: selected, 2: partially selected
  pointCount: number;
}
