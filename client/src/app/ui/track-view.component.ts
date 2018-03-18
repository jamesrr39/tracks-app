import { Component, Input, ViewChild } from '@angular/core';
import { Router, ActivatedRoute, ParamMap } from '@angular/router';

import 'rxjs/add/operator/switchMap';
import { of } from 'rxjs/observable/of';

import * as OpenLayers from 'openlayers';

import { TrackService } from '../service/track.service';
import { Track } from '../domain/track';
import { Lap } from '../domain/lap';

@Component({
  selector: "track-view",
  template: `
  <div *ngIf="!isDataLoaded">
    Loading
  </div>
  <div *ngIf="isDataLoaded">
    {{ track.summary.getDistanceString() }} in {{ track.summary.getDurationString() }}
  </div>
  <div #map></div>
  <div *ngIf="areLapsLoaded">
    <speed-chart track="track"></speed-chart>
    <table class="table">
      <thead>
        <tr>
          <th>Duration</th>
          <th>Lap Distance</th>
          <th>cumulative Distance</th>
          <th>Altitude Gain</th>
          <th>Start Altitude</th>
          <th>End Altitude</th>
        </tr>
      </thead>
      <tbody>
        <tr *ngFor="let lap of laps">
          <td>{{ lap.getDurationString() }}</td>
          <td>{{ lap.distanceInLapMetres }}m</td>
          <td>{{ lap.cumulativeDistanceMetres }}m</td>
          <td>{{ lap.endAltitude - lap.startAltitude }}m</td>
          <td>{{ lap.startAltitude }}m</td>
          <td>{{ lap.endAltitude }}m</td>
        </tr>
      </tbody>
    </table>
  </div>
  `
}) //startTimestamp, public endTimestamp: Date, public distanceInLapMetres, public cumulativeDistanceMetres, public startAltitude, public endAltitude:
export class TrackView {
  private track: Track;
  private map: OpenLayers.Map;
  private laps: Lap[];

  @ViewChild("map")
  private mapContainer;

  private isDataLoaded = false;
  private areLapsLoaded = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private trackService: TrackService
  ){}

  ngOnInit() {
    this.route.paramMap.switchMap((params: ParamMap) => {
      let trackName = params.get('name');
      return of(trackName);
    }).subscribe((trackName: string) => {

      const fetchTrackObserable = this.trackService.fetchTrack(trackName);
      fetchTrackObserable.subscribe((track) => {
        this.track = track;
        this.isDataLoaded = true;
        this.drawMap();
      }, (err) => {
        throw err;
      });

      const fetchLapsObservable = this.trackService.fetchLaps(trackName);
      fetchLapsObservable.subscribe((laps) => {
        this.laps = laps;
        this.areLapsLoaded = true;
      });
    });
  }

  private drawMap() {
    const coords = this.track.records.map((record) => {
      return [record.posLong, record.posLat];
    }) as [number, number][];

    const lineString = new OpenLayers.geom.LineString(coords);
    lineString.transform('EPSG:4326', 'EPSG:3857');

    const feature = new OpenLayers.Feature({
      geometry: lineString,
      name: "line"
    });

    const lineStyle = new OpenLayers.style.Style({
      stroke: new OpenLayers.style.Stroke({
        color: '#0000ff',
        width: 4
      })
    });

    this.map = new OpenLayers.Map({
      layers: [
        new OpenLayers.layer.Tile({
          source: new OpenLayers.source.OSM()
        }),
        new OpenLayers.layer.Vector({
          source: new OpenLayers.source.Vector({
            features: [feature]
          }),
          style: lineStyle
        })
      ],
      target: this.mapContainer.nativeElement,
      view: new OpenLayers.View({
        center: OpenLayers.proj.fromLonLat([
          (this.track.activityBounds.longMin + this.track.activityBounds.longMax) / 2,
          (this.track.activityBounds.latMin + this.track.activityBounds.latMax) / 2,
        ]),
        resolution: 20
      })
    });
  }
}

@Component({
  selector: "speed-chart",
  template: `
    <canvas baseChart width="400" height="400"
                    [datasets]="lineChartData"
                    [labels]="lineChartLabels"
                    [options]="lineChartOptions"
                    [colors]="lineChartColors"
                    [legend]="lineChartLegend"
                    [chartType]="lineChartType"
                    (chartHover)="chartHovered($event)"
                    (chartClick)="chartClicked($event)"></canvas>
  `
})
export class SpeedChart {
  @Input() track: Track;

  private lineChartData = [];

  private lineChartLabels = [];
  public lineChartOptions:any = {
     responsive: true
   };
   public lineChartColors:Array<any> = [
     { // grey
       backgroundColor: 'rgba(148,159,177,0.2)',
       borderColor: 'rgba(148,159,177,1)',
       pointBackgroundColor: 'rgba(148,159,177,1)',
       pointBorderColor: '#fff',
       pointHoverBackgroundColor: '#fff',
       pointHoverBorderColor: 'rgba(148,159,177,0.8)'
     }
   ];
   public lineChartLegend:boolean = true;
   public lineChartType:string = 'line';

   ngOnInit() {
     this.lineChartData = this.generateChartData();
   }
   generateChartData() {
     if (this.track.records.length === 0) {
       return [];
     }

     const INTERVAL_DURATION_SECONDS = 10;
     const setData = [];
     let lastPoint = this.track.records[0];
     let nextInterval = INTERVAL_DURATION_SECONDS;

     for (let i = 0; i < this.track.records.length; i++) {
       const thisPoint = this.track.records[i];
       if (thisPoint.timestamp.getTime() - lastPoint.timestamp.getTime() >= INTERVAL_DURATION_SECONDS * 1000) {
         const distanceLatDeg = Math.abs(thisPoint.posLat - lastPoint.posLat);
         const distanceLongDeg = Math.abs(thisPoint.posLong - lastPoint.posLong);

         // https://stackoverflow.com/questions/1253499/simple-calculations-for-working-with-lat-lon-km-distance
         const distanceLatM = 110574 * distanceLatDeg;
         const thisLatRadians = (thisPoint.posLat * Math.PI / 180);
         const distanceLongM = 111320 * Math.cos(thisLatRadians);

         const distanceTraveled = Math.sqrt(distanceLatM ** 2 + distanceLongM ** 2);
         setData.push(distanceTraveled);
       }
     }
     return setData;
   }

   public chartClicked(e:any):void {
      console.log(e);
    }

    public chartHovered(e:any):void {
      console.log(e);
    }
}
