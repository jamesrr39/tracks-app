import * as React from 'react';
import { Track } from '../domain/track';
import { Point, LineChart } from '../utilities/line-chart';

type Props = {
  track: Track;
};
//
// type ChartInfo = {
//   data: number[],
//   labels: string[]
// };
//
// const formatTimeLabelForGraph = (seconds: number) => {
//   const hours = Math.floor(seconds / 3600);
//   const remainderMinutes = Math.floor((seconds % 3600) / 60);
//   const remainderSeconds = Math.floor(seconds - ((hours * 3600) + (remainderMinutes * 60)));
//
//   let str = '';
//   if (hours !== 0) {
//     str += `${hours}:`;
//   }
//   let m = remainderMinutes + '';
//   if (m.length === 1 && m !== '0') {
//     m = `0${m}`;
//   }
//   let s = remainderSeconds + '';
//   if (s.length === 1) {
//     s = `0${remainderSeconds}`;
//   }
//
//   str += `${m}:${s}`;
//   return str;
// };

const generateChartData = (track: Track): Point[] => {
  if (track.records.length === 0) {
    return [];
  }

  const INTERVAL_DURATION_MILLISECONDS = 10000;
  const points = [];
  let lastPoint = track.records[0];
  // let nextInterval = INTERVAL_DURATION_SECONDS;

  for (let i = 0; i < track.records.length; i++) {
    const thisPoint = track.records[i];
    const timeSinceLastInterval = thisPoint.timestamp.getTime() - lastPoint.timestamp.getTime();
    if (timeSinceLastInterval < INTERVAL_DURATION_MILLISECONDS) {
      continue;
    }
    const distanceLatDeg = Math.abs(thisPoint.posLat - lastPoint.posLat);
    const distanceLongDeg = Math.abs(thisPoint.posLong - lastPoint.posLong);

    // https://stackoverflow.com/questions/1253499/simple-calculations-for-working-with-lat-lon-km-distance
    const distanceLatKM = distanceLatDeg * 110.574;
    const thisLatRadians = (thisPoint.posLat * Math.PI / 180);
    const distanceLongKM = distanceLongDeg * (111.320 * Math.cos(thisLatRadians));

    const distanceTraveledM = Math.sqrt((distanceLatKM * 1000) ** 2 + (distanceLongKM * 1000) ** 2);
    const intervalSpeedMetresSecond = distanceTraveledM * 1000 / INTERVAL_DURATION_MILLISECONDS;

    const intervalSpeedKph = intervalSpeedMetresSecond * 3600 / 1000;
    const timeThroughTrack = (thisPoint.timestamp.getTime() - track.summary.startTime.getTime()) / 1000;

    points.push({
      x: timeThroughTrack,
      y: intervalSpeedKph,
    });
    // labels.push((i * INTERVAL_DURATION_MILLISECONDS / 1000) + '');

    lastPoint = thisPoint;
  }
  return points;
};

// const styles = {
//   canvas: {
//     width: '100%',
//     height: '300px',
//   },
// };

export class SpeedChart extends React.Component<Props> {
  render() {
    const chartData = generateChartData(this.props.track);
    const refCb = (canvas: HTMLCanvasElement|null) => {
      if (canvas === null) {
        // tslint:disable-next-line
        console.log('canvas was null');
        return;
      }
      (new LineChart(canvas, chartData)).render();
    };

    return <canvas ref={refCb} width={'1800px'} height={'300px'} />;
  }
}

//
// const generateChartData = (track: Track): ChartInfo => {
//   if (track.records.length === 0) {
//     return {data: [], labels: []};
//   }
//
//   const INTERVAL_DURATION_MILLISECONDS = 10000;
//   const data = [];
//   const labels = [];
//   let lastPoint = track.records[0];
//   // let nextInterval = INTERVAL_DURATION_SECONDS;
//
//   for (let i = 0; i < track.records.length; i++) {
//     const thisPoint = track.records[i];
//     const timeSinceLastInterval = thisPoint.timestamp.getTime() - lastPoint.timestamp.getTime();
//     if (timeSinceLastInterval < INTERVAL_DURATION_MILLISECONDS) {
//       continue;
//     }
//     const distanceLatDeg = Math.abs(thisPoint.posLat - lastPoint.posLat);
//     const distanceLongDeg = Math.abs(thisPoint.posLong - lastPoint.posLong);
//
//     // https://stackoverflow.com/questions/1253499/simple-calculations-for-working-with-lat-lon-km-distance
//     const distanceLatKM = distanceLatDeg * 110.574;
//     const thisLatRadians = (thisPoint.posLat * Math.PI / 180);
//     const distanceLongKM = distanceLongDeg * (111.320 * Math.cos(thisLatRadians));
//
//     const distanceTraveledM = Math.sqrt((distanceLatKM * 1000) ** 2 + (distanceLongKM * 1000) ** 2);
//     const intervalSpeedMetresSecond = distanceTraveledM * 1000 / INTERVAL_DURATION_MILLISECONDS;
//
//     const intervalSpeedKph = intervalSpeedMetresSecond * 3600 / 1000;
//     data.push(parseFloat(intervalSpeedKph.toFixed(2)));
//     labels.push(formatTimeLabelForGraph((thisPoint.timestamp.getTime() - track.summary.startTime.getTime()) / 1000));
//     // labels.push((i * INTERVAL_DURATION_MILLISECONDS / 1000) + '');
//
//     lastPoint = thisPoint;
//   }
//   return {
//     data,
//     labels
//   };
// };
//
// export class SpeedChart extends React.Component<Props> {
//   render() {
//     const cd = generateChartData(this.props.track);
//     const chartData = {
//       labels: cd.labels,
//       datasets: [{
//         label: 'Speed (kph)',
//         data: cd.data,
//         lineTension: 0,
//       }]
//     };
//
//     // tslint:disable-next-line
//     console.log(chartData);
//
//     return <p>{JSON.stringify(chartData)}</p>;
//   }
// }
