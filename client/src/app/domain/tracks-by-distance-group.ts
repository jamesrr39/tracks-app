import { GroupedTrackSummaries, Group } from "./trackGroup";
import { TrackSummary } from "./track";


export class TracksByDistanceView implements GroupedTrackSummaries {
  constructor(private trackSummaries: TrackSummary[]) {}

  getGroups(): Group[] {
    const groupsMap = new Map<number, TrackSummary[]>(); // number = multiple of 5. Ex = 2.5km = 0, 6km = 1, 15km = 3

    this.trackSummaries.forEach((trackSummary) => {
      const distanceMultipleOf5 = Math.floor(trackSummary.totalDistance / 5000);
      if (!groupsMap.get(distanceMultipleOf5)) {
        groupsMap.set(distanceMultipleOf5, []);
      }

      groupsMap.get(distanceMultipleOf5).push(trackSummary);
    });

    const groups = [];

    groupsMap.forEach((trackSummaries, distanceMultipleOf5) => {
      trackSummaries.sort((a, b) => {
        if (a.totalDistance > b.totalDistance) {
          return 1;
        }

        return -1;
      });

      const name = (distanceMultipleOf5 * 5) + "-" + ((distanceMultipleOf5 + 1) * 5) + "km"
      groups.push(new Group(name, trackSummaries));
    });


    return groups;
  }
}
