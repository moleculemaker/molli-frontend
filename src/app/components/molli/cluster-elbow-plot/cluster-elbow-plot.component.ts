import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { ScaleLinear, scaleLinear } from 'd3-scale';
import { line } from 'd3-shape';

@Component({
  selector: 'app-cluster-elbow-plot',
  templateUrl: './cluster-elbow-plot.component.html',
  styleUrls: ['./cluster-elbow-plot.component.scss']
})
export class ClusterElbowPlotComponent implements OnChanges {

  @Input()
  distortions: number[];

  @Input()
  knee: number;

  @Input()
  selectedNumberOfClusters: number;
  @Output()
  selectedNumberOfClustersChange = new EventEmitter<number>();

  viewBox = {
    height: 206,
    width: 563
  };

  margins = {
    top: 18,
    right: 20,
    bottom: 60,
    left: 60
  };

  pointRadius = {
    selected: 4,
    deselected: 3
  };

  xScale: ScaleLinear<number, number>;
  yScale: ScaleLinear<number, number>;
  yTicks: number[];
  linePath: string;

  constructor() {
  }

  ngOnChanges(changes: SimpleChanges) {
    if (this.distortions) {
      this.drawPlot();
    }
  }

  drawPlot(): void {
    this.xScale = scaleLinear().domain([1, this.distortions.length]).range([this.margins.left, this.viewBox.width - this.margins.right]);
    // yMax will be 110% of the first distortion
    this.yScale = scaleLinear().domain([0, 1.1 * this.distortions[0]]).range([this.viewBox.height - this.margins.bottom, this.margins.top]);
    this.yTicks = this.yScale.nice(5).ticks(5);
    this.linePath = line().x(d => this.xScale(d[0])).y(d => this.yScale(d[1]))(this.distortions.map((dist, idx) => [idx+1, dist])) as string;
  }

  selectNumberOfClusters(num: number): void {
    this.selectedNumberOfClustersChange.emit(num);
  }
}
