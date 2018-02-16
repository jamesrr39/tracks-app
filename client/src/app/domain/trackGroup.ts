import { TrackSummary } from "./track";
import { formatDuration } from "./duration";

export class Group {
  constructor(
    public readonly name: string,
    public readonly trackSummaries: TrackSummary[]){}

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

export interface GroupedTrackSummaries {
  getGroups(): Group[]
}
