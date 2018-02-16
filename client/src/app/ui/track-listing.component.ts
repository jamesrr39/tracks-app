import { Component } from '@angular/core';

import { TrackService } from '../service/track.service';
import { TrackSummary } from '../domain/track';

import { formatDuration } from '../domain/duration';
import { GroupedTrackSummaries } from '../domain/trackGroup';
import { TracksByDistanceView } from '../domain/tracks-by-distance-group';
import { TracksByMonthView } from '../domain/tracks-by-month-group';

@Component({
  selector: "track-listing",
  template: `
  <div *ngIf="isLoaded" class="container">
    <div class="row">
      <button (click)="showByMonthView()">Date</button>
      <button (click)="showByDistanceView()">Km</button>
    </div>
    <div *ngFor="let group of trackSummaryGroups.getGroups()" class="row">
      <h3>{{ group.name }}</h3>
      <small>{{ group.trackSummaries.length }} tracks, {{ group.getTotalDistanceKm() }}Km in {{ group.getTotalDurationStr() }}</small>
      <div class="summaries-container">
        <div class="summary-container" *ngFor="let trackSummary of group.trackSummaries">
          <track-summary [trackSummary]="trackSummary"></track-summary>
        </div>
      </div>
    </div>
  </div>
  `,
  styles: [`
    .summaries-container {
      display: flex;
      flex-direction: row;
      flex-wrap: wrap;
    }

    .summary-container {
      background-color: lightblue;
      margin: 10px;
    }`]
})
export class TrackListing {
  private trackSummaries: TrackSummary[] = [];
  private trackSummaryGroups: GroupedTrackSummaries;
  private isLoaded = false;

  constructor(private trackService: TrackService){}

  ngOnInit() {
    this.trackService.fetchAllSummaries().subscribe((trackSummaries) => {
      trackSummaries.sort((a, b) => {
        if (a.startTime < b.startTime){
          return 1;
        }
        return -1;
      });
      this.trackSummaries = trackSummaries;
      this.trackSummaryGroups = new TracksByMonthView(trackSummaries);
      this.isLoaded = true;
    }, (err) => {
      throw err;
    });
  }

  showByMonthView() {
    this.trackSummaryGroups = new TracksByMonthView(this.trackSummaries);
  }

  showByDistanceView() {
    this.trackSummaryGroups = new TracksByDistanceView(this.trackSummaries);
  }
}
