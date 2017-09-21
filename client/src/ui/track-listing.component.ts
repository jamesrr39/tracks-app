import { Component } from '@angular/core';

import { TrackService } from '../service/track.service';
import { TrackSummary } from '../domain/track';

import { formatDuration } from '../domain/duration';

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
      <div>
        <div *ngFor="let trackSummary of group.trackSummaries">
          <a routerLink="/tracks/{{ encodeURIComponent(trackSummary.name) }}" routerLinkActive="active">
            {{ trackSummary.getDistanceString() }} in {{ trackSummary.getDurationString() }} on  {{ formatDateToISOString(trackSummary.startTime) }}
          </a>
          <small>({{ trackSummary.name }})</small>
        </div>
      </div>
    </div>
  </div>
  `
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

class Group {
  constructor(public name: string, public trackSummaries: TrackSummary[]){}

  getTotalDistanceKm() :string {
    const distanceMetres = this.trackSummaries.map((trackSummary) => {
      return trackSummary.totalDistance;
    }).reduce((prev, thisVal) => {
      return prev + thisVal;
    });

    return (distanceMetres / 1000).toFixed(2);
  }

  getTotalDurationStr() :string {
    const durationSeconds = this.trackSummaries.map((trackSummary) => {
      return trackSummary.getDurationSeconds();
    }).reduce((prev, thisVal) => {
      return prev + thisVal;
    });

    return formatDuration(durationSeconds);
  }
}

interface GroupedTrackSummaries {
  getGroups(): Group[]
}

class TracksByMonthView implements GroupedTrackSummaries {
  constructor(private trackSummaries: TrackSummary[]) {}

  getGroups(): Group[] {
    const monthMap = new Map<string, TrackSummary[]>(); // string = monthName

    this.trackSummaries.forEach((trackSummary) => {
      const monthStr = trackSummary.startTime.getFullYear() + "-" + (trackSummary.startTime.getMonth() + 1);

      const existingList = monthMap.get(monthStr);
      if (!existingList) {
        monthMap.set(monthStr, []);
      }

      monthMap.get(monthStr).push(trackSummary);
    });

    const monthList: Group[] = [];
    monthMap.forEach((trackSummaries, monthStr) => {
      trackSummaries.sort((a, b) => {
        if (a.startTime.getTime() > b.startTime.getTime()) {
          return 1;
        }
        return -1;
      });

      const totalDistanceMetres = trackSummaries.map((trackSummary) => {
        return trackSummary.totalDistance;
      }).reduce((prev, thisNum) => {
        return prev + thisNum;
      });

      const totalTimeSeconds = trackSummaries.map((TrackSummary) => {
        return TrackSummary.getDurationSeconds();
      }).reduce((prev, thisNum) => {
        return prev + thisNum;
      });

      monthList.push(new Group(monthStr, trackSummaries));
    });

    return monthList;
  }
}

class TracksByDistanceView implements GroupedTrackSummaries {
  constructor(private trackSummaries: TrackSummary[]) {}

  getGroups(): Group[] {
    const groupsMap = new Map<number, TrackSummary[]>(); // number = multiple of 5. Ex = 2.5km = 0, 6km = 1, 15km = 3

    this.trackSummaries.forEach((trackSummary) => {
      const distanceMultipleOf5 = Math.floor(trackSummary.totalDistance / 5000);
      if (!groupsMap.get(distanceMultipleOf5)) {
        groupsMap.set(distanceMultipleOf5, []);
      }

      groupsMap.get(distanceMultipleOf5).push(trackSummary);
    });

    const groups: Group[] = [];

    groupsMap.forEach((trackSummaries, distanceMultipleOf5) => {
      trackSummaries.sort((a, b) => {
        if (a.totalDistance > b.totalDistance) {
          return 1;
        }

        return -1;
      });

      const name = (distanceMultipleOf5 * 5) + "-" + ((distanceMultipleOf5 + 1) * 5) + "km"
      groups.push(new Group(name, trackSummaries));
    });

    return groups;
  }
}
