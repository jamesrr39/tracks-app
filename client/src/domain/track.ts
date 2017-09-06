import {Record} from './record';
import {ActivityBounds} from './activityBounds';

export class TrackSummary {
  constructor(public name: string, public startTime: Date, public endTime: Date, public deviceManufacturer: string, public deviceProduct: string, public totalDistance: number){}

  getDurationSeconds(): number {
    return (this.endTime.getTime() - this.startTime.getTime()) / 1000;
  }

  getDurationString(): string {
    const durationSeconds = this.getDurationSeconds();

    const hours = Math.floor(durationSeconds / (3600));
    const minutes = (Math.floor(durationSeconds / 60)) - (hours * 60)
    const seconds = durationSeconds - (minutes * 60 + hours * 3600)

    let s = "";
    if (hours !== 0) {
      s += hours + "h ";
    }
    if (minutes !== 0) {
      s += minutes + "m ";
    }
    s+= seconds + "s";

    return s;
  }

  getDistanceString(): string {
    return (this.totalDistance/1000).toFixed(2) + "km";
  }
}

export class Track {
  constructor(public summary: TrackSummary, records: Record[], activityBounds: ActivityBounds){}
}
