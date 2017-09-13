import { Component } from '@angular/core';

import { TrackService } from '../service/track.service';
import { TrackSummary } from '../domain/track';

@Component({
  selector: "track-listing",
  template: `
  <div>
    <div *ngFor="let trackSummary of trackSummaries">
      <a routerLink="/tracks/{{ encodeURIComponent(trackSummary.name) }}" routerLinkActive="active">
        {{ trackSummary.getDistanceString() }} in {{ trackSummary.getDurationString() }} on  {{ formatDateToISOString(trackSummary.startTime) }}
      </a>
      <small>({{ trackSummary.name }})</small>
    </div>
  </div>
  `
})
export class TrackListing {
  private trackSummaries: TrackSummary[] = [];

  constructor(private trackService: TrackService){}

  ngOnInit() {
    this.trackService.fetchAllSummaries().subscribe((trackSummaries) => {
      trackSummaries.sort((a, b) => {
        if (a.startTime < b.startTime){
          return 1;
        }
        return -1;
      })
      this.trackSummaries = trackSummaries;
    }, (err) => {
      throw err;
    });
  }

  encodeURIComponent(text: string) {
    return encodeURIComponent(text);
  }

  formatDateToISOString(date: Date) {
    let month = (date.getMonth() + 1) + "";
    if (month.length === 1) {
      month = "0" + month;
    }

    let day = date.getDate() + "";
    if (day.length === 1) {
      day = "0" + day;
    }

    return date.getFullYear() + "-" + month + "-" + day;
  }
}
