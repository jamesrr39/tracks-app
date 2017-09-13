import { Record } from './record';
import { ActivityBounds } from './activityBounds';
import { getDurationString } from './duration';

export class TrackSummary {
  constructor(public name: string, public startTime: Date, public endTime: Date, public deviceManufacturer: string, public deviceProduct: string, public totalDistance: number){}

  getDurationString() {
   return getDurationString(this.startTime, this.endTime);
  }

  getDistanceString(): string {
    return (this.totalDistance/1000).toFixed(2) + "km";
  }
}

export class Track {
  constructor(public summary: TrackSummary, public records: Record[], public activityBounds: ActivityBounds){}
}
