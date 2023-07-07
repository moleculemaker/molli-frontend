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

  highlightedCluster: Cluster|null = null;
  highlightedPoint: Point|null = null;

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

  pointRadius = 5;
  starOffset = 6.5;
  // from https://codepen.io/osublake/pen/LVLvKv, using points = 5, inner radius = 4, outer radius = 7
  starPoints = '7,0,9.351141009169893,3.76393202250021,13.657395614066075,4.836881039375368,10.804226065180615,8.23606797749979,11.114496766047314,12.663118960624631,7.000000000000001,11,2.885503233952689,12.663118960624633,3.195773934819386,8.23606797749979,0.3426043859339245,4.83688103937537,4.648858990830107,3.7639320225002106';

  points: Point[] = [];
  clusters: Cluster[] = [];

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

      // build data structures to represent clusters
      this.clusters = [];
      for (let i = 0; i < this.numberOfClusters; i++) {
        this.clusters.push({
          exemplar: null as unknown as Point, // we'll fix this in a moment
          index: i,
          color: this.colors[i],
          isSelected: this.selectedClusterIndices.includes(i)
        });
      }

      // create x scale and y scale
      const xExtent = extent(Object.values(this.data.coordinates['0'])) as [number, number];
      const yExtent = extent(Object.values(this.data.coordinates['1'])) as [number, number];
      this.xScale = scaleLinear().domain(xExtent).range([this.margins.left, this.viewBox.width - this.margins.right]);
      this.yScale = scaleLinear().domain(yExtent).range([this.viewBox.height - this.margins.bottom, this.margins.top]);

      // prepare points for plotting
      this.points = Object.entries(this.data.clusterAssignments[this.numberOfClusters]).map(([name, clusterIndex]) => ({
        x: this.xScale(this.data!.coordinates['0'][name]),
        y: this.yScale(this.data!.coordinates['1'][name]),
        name,
        svg: structureNameToStructure.get(name)!.svg,
        cluster: this.clusters[clusterIndex]
      }));

      // get exemplars
      const exemplarsForCurrentNumberOfClusters = this.data.exemplars.find(exemplars => exemplars.length === this.numberOfClusters);
      const exemplarNameToClusterIndex = new Map<string, number>(
        exemplarsForCurrentNumberOfClusters!.map((name, index) => [name, index])
      );
      this.points.filter(point => exemplarNameToClusterIndex.has(point.name)).forEach(exemplar => {
        const cluster = this.clusters[exemplarNameToClusterIndex.get(exemplar.name)!];
        cluster.exemplar = exemplar;
      });
    }
  }

  toggleCluster(cluster: Cluster): void {
    cluster.isSelected = !cluster.isSelected;
    this.selectedClusterIndices = this.clusters.filter(cluster => cluster.isSelected).map(cluster => cluster.index);
    this.selectedClusterIndicesChange.emit(this.selectedClusterIndices);
  }

  highlightCluster(cluster: Cluster, point: Point|null = null): void {
    this.highlightedCluster = cluster;
    this.highlightedPoint = point;
  }
  unhighlightCluster(): void {
    this.highlightedCluster = null;
    this.highlightedPoint = null;
  }
}

interface Point {
  x: number;
  y: number;
  name: string;
  svg: string;
  cluster: Cluster;
}

interface Cluster {
  index: number;
  exemplar: Point;
  color: string;
  isSelected: boolean;
}
