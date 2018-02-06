import { Record } from './record';
import { ActivityBounds } from './activityBounds';
import { getDurationString } from './duration';
import { GeographicMapElement } from './geographicMapElement';

export class TrackSummary {
  constructor(
    public readonly name: string,
    public readonly startTime: Date,
    public readonly endTime: Date,
    public readonly deviceManufacturer: string,
    public readonly deviceProduct: string,
    public readonly totalDistance: number,
    public readonly activityBounds: ActivityBounds[],
    public readonly nearbyObjects: GeographicMapElement[]
){}

  getDurationString() {
   return getDurationString(this.startTime, this.endTime);
  }

  getDistanceString(): string {
    return (this.totalDistance/1000).toFixed(2) + "km";
  }

  getDurationSeconds() {
    return (this.endTime.getTime() - this.startTime.getTime()) / 1000;
  }
}

export class Track {
  constructor(public summary: TrackSummary, public records: Record[], public activityBounds: ActivityBounds){}
}
