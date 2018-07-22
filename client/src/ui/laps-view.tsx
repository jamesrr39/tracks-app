import * as React from 'react';
import { Track } from '../domain/track';
import { formatDuration } from '../utilities/duration';

type Props = {
  track: Track;
};

const LAP_DISTANCE_M = 1000; // 1km

type LapStats = {
  startTime: Date;
  endTime: Date;
  startDistanceM: number;
  endDistanceM: number;
};

export class LapsView extends React.Component<Props> {
  render() {
    const { track } = this.props;
    const laps: LapStats[] = [];
    let nextLapBound = LAP_DISTANCE_M;
    let lapStartTimeMS = track.records[0].timestamp;
    let lapStartDistanceM = track.records[0].distance;

    this.props.track.records.forEach(record => {
      if (record.distance < nextLapBound) {
        return;
      }

      const lap = {
        startTime: lapStartTimeMS,
        endTime: record.timestamp,
        startDistanceM: lapStartDistanceM,
        endDistanceM: record.distance,
      };

      laps.push(lap);

      lapStartTimeMS = record.timestamp;
      lapStartDistanceM = record.distance;
      nextLapBound += LAP_DISTANCE_M;
    });

    const lapsHtml = laps.map((lap, index) => {
      const lapDurationSeconds = (lap.endTime.getTime() - lap.startTime.getTime()) / 1000;

      return (
        <tr key={index}>
          <td>{index + 1}</td>
          <td>{lap.endDistanceM - lap.startDistanceM}</td>
          <td>{formatDuration(lapDurationSeconds)}</td>
        </tr>
      );
    });

    return (
      <table>
        <thead>
          <tr>
            <th>Lap</th>
            <th>Distance</th>
            <th>Time</th>
          </tr>
        </thead>
        <tbody>
          {lapsHtml}
        </tbody>
      </table>
    );
  }
}
