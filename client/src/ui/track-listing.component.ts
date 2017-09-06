import { Component } from '@angular/core';

import { TrackService } from '../service/track.service';
import { TrackSummary } from '../domain/track';

@Component({
  selector: "track-listing",
  template: `
  <div>
    <div *ngFor="let trackSummary of trackSummaries">
      <a routerLink="/tracks/{{trackSummary.name}}" routerLinkActive="active">
        {{ trackSummary.name }}
      </a>
      {{ trackSummary.getDurationString() }}
    </div>
  </div>
  `
})
export class TrackListing {
  private trackSummaries: TrackSummary[] = [];

  constructor(private trackService: TrackService){}

  ngOnInit() {
    this.trackService.fetchAllSummaries().subscribe((trackSummaries) => {
      this.trackSummaries = trackSummaries;
    }, (err) => {
      throw err;
    });
  }
}
