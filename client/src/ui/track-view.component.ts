import { Component, Input } from '@angular/core';
import { Router, ActivatedRoute, ParamMap } from '@angular/router';

import 'rxjs/add/operator/switchMap';

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
  `
})
export class TrackView {
  private track: Track;


  private isDataLoaded = false;

  constructor(private route: ActivatedRoute, private router: Router, private trackService: TrackService){}

  ngOnInit() {
    this.route.paramMap.switchMap((params: ParamMap) => {
      return this.trackService.fetchTrack(params.get('name'));
    }).subscribe((track) => {
      this.track = track;
      this.isDataLoaded = true;
    }, (err) => {
      throw err;
    });
  }
}
