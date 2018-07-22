import { Record } from './record';
import { ActivityBounds } from './activityBounds';
import { getDurationString } from '../utilities/duration';
import { GeographicMapElement } from './geographicMapElement';

export type TrackSummary = {
   name: string,
   startTime: Date,
   endTime: Date,
   deviceManufacturer: string,
   deviceProduct: string,
   totalDistance: number,
   activityBounds: ActivityBounds[],
   nearbyObjects: GeographicMapElement[]
};

export function getTrackDurationString(trackSummary: TrackSummary) {
  return getDurationString(trackSummary.startTime, trackSummary.endTime);
}

export function getDistanceString(trackSummary: TrackSummary): string {
  return (trackSummary.totalDistance / 1000).toFixed(2) + 'km';
}

export function getDurationSeconds(trackSummary: TrackSummary) {
  return (trackSummary.endTime.getTime() - trackSummary.startTime.getTime()) / 1000;
}

export type Track = {
  summary: TrackSummary,
  records: Record[],
  activityBounds: ActivityBounds
};
