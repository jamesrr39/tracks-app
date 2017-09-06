import { Component, Input, ViewChild } from '@angular/core';
import { Router, ActivatedRoute, ParamMap } from '@angular/router';

import 'rxjs/add/operator/switchMap';

import * as OpenLayers from 'openlayers';

import { TrackService } from '../service/track.service';
import { Track } from '../domain/track';

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
  `
})
export class TrackView {
  private track: Track;
  private map: OpenLayers.Map;

  @ViewChild("map")
  private mapContainer;

  private isDataLoaded = false;

  constructor(private route: ActivatedRoute, private router: Router, private trackService: TrackService){}

  ngOnInit() {
    this.route.paramMap.switchMap((params: ParamMap) => {
      return this.trackService.fetchTrack(params.get('name'));
    }).subscribe((track) => {
      this.track = track;
      this.isDataLoaded = true;
      this.drawMap();
    }, (err) => {
      throw err;
    });

    OpenLayers.Map
  }

  private drawMap() {
    console.log("drawing map")
    const waypoints = new OpenLayers.layer.Vector({
      source: new OpenLayers.source.Vector({
        features: this.track.records.map((record) => {
          const coords = OpenLayers.proj.transform([
              record.posLong,
              record.posLat
            ], "EPSG:4326", "EPSG:3857");

          return new OpenLayers.Feature({
            geometry: new OpenLayers.geom.Point(coords),
            name: record.distance
          });
        })
      })
    });

    this.map = new OpenLayers.Map({
      layers: [
        new OpenLayers.layer.Tile({
          source: new OpenLayers.source.OSM()
        }),
        waypoints
      ],
      /*controls: OpenLayers.control.defaults({
        attributionOptions: {
          collapsible: false
        }
      }),*/
      target: this.mapContainer.nativeElement,
      //renderer: "canvas",
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
