import { useState } from "preact/hooks";
import TracksListing from "./TracksList";
import TracksListingTable from "./TracksListingTable";
import FilterComponent, { Filter } from "./ListingFilter";
import { DomainGeoFileSummary } from "../../openapi/generated/tracksAppSchemas";
import Breadcrumb from "../breadcrumb/Breadcrumb";

type Props = {
  allTrackSummaries: DomainGeoFileSummary[]
}

function TracksGallery({allTrackSummaries}: Props) {
  const {activities, devices, dateRange} = getFilterProps(allTrackSummaries);

  const [filter, setFilter] = useState<Filter>({activities: [], devices: [], dateRange});

  const [displayStyle, setDisplayStyle] = useState<'list' | 'table'>("list");

  const trackSummaries = allTrackSummaries.filter(trackSummary => {
    if (filter.activities.length !== 0) {
      if (!filter.activities.includes(trackSummary.activityType)) {
        return false;
      }
    }

    if (filter.devices.length !== 0) {
      if (!filter.devices.includes(trackSummary.device)) {
        return false;
      }
    }

    if (filter.dateRange.start > trackSummary.startTime) {
      return false;
    }
    if (filter.dateRange.end < trackSummary.endTime) {
      return false;
    }

    return true;
  });

  trackSummaries.sort((a, b) => {
    return a.endTime < b.endTime ? 1 : -1;
  });

  return (
    <div>
      <Breadcrumb pathFragments={["tracks"]} />
      <button onClick={event =>{
        event.preventDefault();
        setDisplayStyle(displayStyle => {
          return displayStyle === 'list' ? 'table' : 'list';
        })
      }}>Change list style</button>
      <div>
        <FilterComponent
          activities={activities}
          devices={devices}
          dateRange={dateRange}
          filter={filter}
          onChange={(filter: Filter) => {
            setFilter(filter);
          }}
        />
      </div>
      {trackSummaries.length === 0 && <p>No results found</p>}
      {displayStyle === 'list' && <TracksListing trackSummaries={trackSummaries} />}
      {displayStyle === 'table' && <TracksListingTable trackSummaries={trackSummaries} />}
    </div>
  );
}

function getFilterProps(trackSummaries: DomainGeoFileSummary[]) {
  const activitiesSet = new Set<string>();
  const devicesSet = new Set<string>();
  let dateRangeStart = new Date();
  let dateRangeEnd = new Date('0001-01-01');

  trackSummaries.forEach(trackSummary => {
    activitiesSet.add(trackSummary.activityType);
    devicesSet.add(trackSummary.device);
    const startTime = new Date(trackSummary.startTime);
    if (startTime < dateRangeStart) {
      dateRangeStart = startTime;
    }
    const endTime = new Date(trackSummary.endTime);
    if (endTime > dateRangeEnd) {
      dateRangeEnd = endTime;
    }
  });

  const activities = [...activitiesSet];
  const devices = [...devicesSet];

  activities.sort(stringSort);
  devices.sort(stringSort);

  return {
    activities,
    devices,
    dateRange: {start: dateObjToISODate(dateRangeStart), end: dateObjToISODate(dateRangeEnd)}
  };
}

function dateObjToISODate(d: Date) {
  return d.toISOString().split('T')[0]
}

function stringSort(a: string, b: string) {
    if (a === b) {
      return 0;
    }

    return a < b ? 1 : -1;
  }

  export default TracksGallery;