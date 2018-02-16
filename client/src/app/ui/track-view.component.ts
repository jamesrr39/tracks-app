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
