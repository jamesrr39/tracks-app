import { Component, Input } from '@angular/core';
import { TrackSummary } from '../domain/track';

@Component({
  selector: "track-summary",
  template: `
  <a routerLink="/tracks/{{ encodeURIComponent(trackSummary.name) }}" routerLinkActive="active">
    {{ trackSummary.getDistanceString() }} in {{ trackSummary.getDurationString() }} on  {{ formatDateToISOString(trackSummary.startTime) }}
    <ul>
      <li *ngFor="let nearbyObject of trackSummary.nearbyObjects">
        {{ nearbyObject.tags.name }} ({{ nearbyObject.tags.place }})
      </li>
    </ul>
  </a>
  <small>({{ trackSummary.name }})</small>
  `
})
export class TrackListingSummary {
  @Input() trackSummary: TrackSummary;

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
