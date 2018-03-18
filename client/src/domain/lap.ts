import { getDurationString } from '../utilities/duration';

export type Lap = {
  startTime: Date,
  endTime: Date,
  distanceInLapMetres: number,
  cumulativeDistanceMetres: number,
  startAltitude: number,
  endAltitude: number
};

export function getLapDurationString(lap: Lap) {
  return getDurationString(lap.startTime, lap.endTime);
}
