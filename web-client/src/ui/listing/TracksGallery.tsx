import { useState } from "preact/hooks";
import TracksListing from "./TracksList";
import TracksListingTable from "./TracksListingTable";
import FilterComponent, { Filter } from "./ListingFilter";
import { DomainGeoFileSummary } from "../../openapi/generated/tracksAppSchemas";
import Breadcrumb from "../breadcrumb/Breadcrumb";
import ListIcon from 'bootstrap-icons/icons/card-list.svg';
import TableIcon from 'bootstrap-icons/icons/table.svg';
import { toLocalDate } from "../DateRangePicker";

const styles = {
  activeDisplayStyle: {
    backgroundColor: '#ccc'
  }
};

type Props = {
  allTrackSummaries: DomainGeoFileSummary[]
}

function TracksGallery({allTrackSummaries}: Props) {
  const {activities, devices, dateRange, distanceRange} = getFilterProps(allTrackSummaries);

  const [filter, setFilter] = useState<Filter>({activities: [], devices: [], dateRange, distanceRange});

  const [displayStyle, setDisplayStyle] = useState<'list' | 'table'>("list");

  const filterStartDate = toLocalDate(new Date(filter.dateRange.start));
  const filterEndDate = toLocalDate(new Date(filter.dateRange.end));

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

    const trackSummaryStart = toLocalDate(new Date(trackSummary.startTime));
    const trackSummaryEnd = toLocalDate(new Date(trackSummary.endTime));

    // can compare ISO date strings without converting to other objects
    if (trackSummaryStart > filterEndDate || trackSummaryEnd < filterStartDate) {
      return false;
    }

    if (filter.distanceRange.lowest > trackSummary.totalDistance) {
      return false;
    }
    if (filter.distanceRange.highest < trackSummary.totalDistance) {
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

      <div>
        <FilterComponent
          activities={activities}
          devices={devices}
          dateRange={dateRange}
          distanceRange={distanceRange}
          filter={filter}
          onChange={(filter: Filter) => {
            setFilter(filter);
          }}
        />
      </div>
      <button
        title="List"
        onClick={event =>{
          event.preventDefault();
          setDisplayStyle(() => 'list');
        }}
        style={displayStyle === 'list' ? styles.activeDisplayStyle : undefined}
      >
        <img src={ListIcon}/>
      </button>

      <button
        title="Table"
        onClick={event =>{
          event.preventDefault();
          setDisplayStyle(() => 'table');
        }}
        style={displayStyle === 'table' ? styles.activeDisplayStyle : undefined}
      >
        <img src={TableIcon}/>
      </button>
      
      {trackSummaries.length === 0 && <p>No results found</p>}
      {displayStyle === 'table' && <TracksListing trackSummaries={trackSummaries} />}
      {displayStyle === 'list' && <TracksListingTable trackSummaries={trackSummaries} />}
    </div>
  );
}

function getFilterProps(trackSummaries: DomainGeoFileSummary[]) {
  const activitiesSet = new Set<string>();
  const devicesSet = new Set<string>();
  let dateRangeStart = new Date();
  let dateRangeEnd = new Date('0001-01-01');
  let distanceKmLowest = 10_000_000;
  let distanceKmHighest = 0;

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

    if (trackSummary.totalDistance < distanceKmLowest) {
      distanceKmLowest = trackSummary.totalDistance;
    }
    if (trackSummary.totalDistance > distanceKmHighest) {
      distanceKmHighest = trackSummary.totalDistance;
    }
  });

  const activities = [...activitiesSet];
  const devices = [...devicesSet];

  activities.sort(stringSort);
  devices.sort(stringSort);

  return {
    activities,
    devices,
    dateRange: {start: dateObjToISODate(dateRangeStart), end: dateObjToISODate(dateRangeEnd)},
    distanceRange: {lowest: distanceKmLowest, highest: distanceKmHighest}
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