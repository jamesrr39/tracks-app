import {
  DomainGeoFileSummary,
  DomainRecord,
} from "../../openapi/generated/tracksAppSchemas";

import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartData,
} from "chart.js";
import { formatShortDuration, getDurationSeconds } from "../../util/time";
import { binarySearch, BinarySearchResult } from "../../util/binary_search";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

type Props = {
  trackRecords: DomainRecord[];
  trackSummary: DomainGeoFileSummary;
};

// https://www.chartjs.org/docs/latest/
type DataType = number[];

function newDataArray(): DataType {
  return [];
}

function TrackChart({ trackSummary, trackRecords }: Props) {
  const trackDurationSeconds = getDurationSeconds(trackSummary);

  const labels: string[] = [];
  const datasets: ChartData<
    "line",
    ReturnType<typeof newDataArray>,
    string
  >["datasets"] = [
    {
      label: "Pace (min/km)",
      data: newDataArray(),
      fill: true,
      borderColor: "rgb(75, 192, 192)",
      tension: 0.1,
      yAxisID: "pace",
    },
    {
      label: "Heart Rate",
      data: newDataArray(),
      fill: true,
      borderColor: "red",
      tension: 0.1,
      yAxisID: "heart-rate",
    },
  ];

  console.log("trackDurationSeconds", trackDurationSeconds, trackSummary);

  let previousRecord: DomainRecord | undefined;
  const RECORD_INTERVAL_SECONDS = 20;
  for (
    let intervalSeconds = 0;
    intervalSeconds < trackDurationSeconds;
    intervalSeconds += RECORD_INTERVAL_SECONDS
  ) {
    const nearestRecordIdx = binarySearch(
      trackRecords.length,
      (binarySearchIdx) => {
        const record = trackRecords[binarySearchIdx];

        const timeThroughSeconds = getDurationSeconds({
          startTime: trackSummary.startTime,
          endTime: record.timestamp,
        });

        if (Math.round(timeThroughSeconds) === intervalSeconds) {
          return BinarySearchResult.EXACT_MATCH;
        }

        if (timeThroughSeconds > intervalSeconds) {
          return BinarySearchResult.GO_LOWER;
        }

        return BinarySearchResult.GO_HIGHER;
      }
    );

    const closestRecord = trackRecords[nearestRecordIdx];

    const timeThroughSeconds = getDurationSeconds({
      startTime: trackSummary.startTime,
      endTime: closestRecord.timestamp,
    });

    labels.push(Math.round(timeThroughSeconds / 60).toFixed(0));
    const pace = previousRecord
      ? calculatePace(previousRecord, closestRecord)
      : 0;
    datasets[0].data.push(pace);
    closestRecord.heartRate && datasets[1].data.push(closestRecord.heartRate);

    previousRecord = closestRecord;
  }

  console.log(trackRecords, labels);

  return (
    <Line
      data={{
        datasets,
        labels,
      }}
      options={{
        scales: {
          xAxis: {
            ticks: {
              callback: (value) => {
                if (typeof value === "string") {
                  throw new Error("got string value for Pace axis");
                }
                return formatShortDuration(value);
              },
            },
          },
          pace: {
            type: "linear",
            position: "left",
            beginAtZero: true,
            title: { text: "Pace" },
            ticks: {
              callback: (value) => {
                if (typeof value === "string") {
                  throw new Error("got string value for Pace axis");
                }
                return formatShortDuration(value * 60);
              },
            },
          },
          "heart-rate": {
            type: "linear",
            position: "right",
            title: { text: "Heart Rate" },
          },
        },
      }}
    />
  );
}

function calculatePace(
  previousRecord: DomainRecord,
  closestRecord: DomainRecord
) {
  const durationSeconds = getDurationSeconds({
    startTime: previousRecord.timestamp,
    endTime: closestRecord.timestamp,
  });

  const deltaDistanceMetres = closestRecord.distance - previousRecord.distance;

  const ratio = 1000 / deltaDistanceMetres;

  const paceSecondsPerKm = durationSeconds * ratio;

  return paceSecondsPerKm;
}

export default TrackChart;
