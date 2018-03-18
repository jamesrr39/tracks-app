// import { TrackSummary } from "./track";
// import { GroupedTrackSummaries, Group } from "./trackGroup";
//
//
// export class TracksByMonthView implements GroupedTrackSummaries {
//   constructor(private trackSummaries: TrackSummary[]) {}
//
//   getGroups(): Group[] {
//     const monthMap = new Map<string, TrackSummary[]>(); // string = monthName
//
//     this.trackSummaries.forEach((trackSummary) => {
//       const monthStr = trackSummary.startTime.getFullYear() + "-" + (trackSummary.startTime.getMonth() + 1);
//
//       const existingList = monthMap.get(monthStr);
//       if (!existingList) {
//         monthMap.set(monthStr, []);
//       }
//
//       monthMap.get(monthStr).push(trackSummary);
//     });
//
//     const monthList: Group[] = [];
//     monthMap.forEach((trackSummaries, monthStr) => {
//       trackSummaries.sort((a, b) => {
//         if (a.startTime.getTime() > b.startTime.getTime()) {
//           return 1;
//         }
//         return -1;
//       });
//
//       const totalDistanceMetres = trackSummaries.map((trackSummary) => {
//         return trackSummary.totalDistance;
//       }).reduce((prev, thisNum) => {
//         return prev + thisNum;
//       });
//
//       const totalTimeSeconds = trackSummaries.map((TrackSummary) => {
//         return TrackSummary.getDurationSeconds();
//       }).reduce((prev, thisNum) => {
//         return prev + thisNum;
//       });
//
//       monthList.push(new Group(monthStr, trackSummaries));
//     });
//
//     return monthList;
//   }
// }
