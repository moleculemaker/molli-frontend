import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { extent } from 'd3-array';
import { ScaleLinear, scaleLinear } from 'd3-scale';

import { ClusteringData } from "../../../models";
import { GeneratedStructureViewModel } from "../results/results.component";

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
  selectedClusterIndices: number[] = [];
  @Output()
  selectedClusterIndicesChange = new EventEmitter<number[]>();

  @Input()
  mode: 'tsne'|'pca';

  highlightedCluster: number|null = null;

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

  exemplarBoxSize = 20;

  points: Point[] = [];
  exemplars: Exemplar[] = [];

  xScale: ScaleLinear<number, number>;
  yScale: ScaleLinear<number, number>;
  colors = [
    "#1f77b4", "#ff7f0e", "#2ca02c", "#d62728",
    "#9467bd", "#8c564b", "#7f7f7f", "#bcbd22",
    "#aec7e8", "#ffbb78", "#98df8a", "#ff9896",
    "#c5b0d5", "#e377c2", "#c7c7c7", "#dbdb8d",
    "#17becf", "#c49c94", "#f7b6d2", "#9edae5"
  ];

  constructor() { }

  ngOnChanges(changes: SimpleChanges) {
    this.draw();
  }

  draw(): void {
    this.points = [];
    if (this.data && this.numberOfClusters && this.data.clusterAssignments[this.numberOfClusters] && this.structureDetails) {
      // create map from structure name to structure
      const structureNameToStructure = new Map<string, GeneratedStructureViewModel>(this.structureDetails.map(structure => [structure.name, structure]));
      // create x scale and y scale
      const xExtent = extent(Object.values(this.data.coordinates['0'])) as [number, number];
      const yExtent = extent(Object.values(this.data.coordinates['1'])) as [number, number];
      this.xScale = scaleLinear().domain(xExtent).range([this.margins.left, this.viewBox.width - this.margins.right]);
      this.yScale = scaleLinear().domain(yExtent).range([this.viewBox.height - this.margins.bottom, this.margins.top]);

      // prepare points for plotting
      this.points = Object.entries(this.data.clusterAssignments[this.numberOfClusters]).map(([name, clusterIndex]) => ({
        x: this.xScale(this.data!.coordinates['0'][name]),
        y: this.yScale(this.data!.coordinates['1'][name]),
        color: this.colors[clusterIndex],
        name,
        cluster: clusterIndex
      }));

      // get exemplars
      const exemplarsForCurrentNumberOfClusters = this.data.exemplars.find(exemplars => exemplars.length === this.numberOfClusters);
      const exemplarNameToClusterIndex = new Map<string, number>(
        exemplarsForCurrentNumberOfClusters!.map((name, index) => [name, index])
      );
      this.exemplars = this.points.filter(point => exemplarNameToClusterIndex.has(point.name)).map(point => {
        const clusterIndex = exemplarNameToClusterIndex.get(point.name)!;
        return {
          point,
          clusterIndex,
          isSelected: this.selectedClusterIndices.includes(clusterIndex),
          tooltipContent: '<h2>Cluster ' + clusterIndex + '</h2><hr><h3>Exemplar: ' + point.name + '</h3>' + structureNameToStructure.get(point.name)!.svg
        };
      }).sort((e1, e2) => e1.clusterIndex - e2.clusterIndex); // template assumes exemplars are sorted in cluster order
    }
  }

  toggleExemplar(exemplar: Exemplar): void {
    exemplar.isSelected = !exemplar.isSelected;
    this.selectedClusterIndices = this.exemplars.filter(ex => ex.isSelected).map(ex => ex.clusterIndex);
    this.selectedClusterIndicesChange.emit(this.selectedClusterIndices);
  }

  highlightCluster(cluster: number): void {
    this.highlightedCluster = cluster;
  }
  unhighlightCluster(): void {
    this.highlightedCluster = null;
  }
}

interface Point {
  x: number;
  y: number;
  color: string;
  name: string;
  cluster: number;
}

interface Exemplar {
  point: Point;
  clusterIndex: number;
  isSelected: boolean;
  tooltipContent: string;
}
