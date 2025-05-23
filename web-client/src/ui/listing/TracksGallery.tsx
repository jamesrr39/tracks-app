import { useState } from "preact/hooks";
import { useGetAllTrackSummaries } from "../../openapi/generated/tracksAppComponents";
import Error from "../Error";
import Loading from "../Loading";
import TracksListing from "./TracksList";
import TracksListingTable from "./TracksListingTable";
import FilterComponent, { Filter } from "./ListingFilter";
import { DomainGeoFileSummary } from "../../openapi/generated/tracksAppSchemas";



export default function TracksGallery() {
  const [displayStyle, setDisplayStyle] = useState<'list' | 'table'>("list");
  const { error, isLoading, data } = useGetAllTrackSummaries({});
  const [filter, setFilter] = useState<Filter>({activities: [], devices: []});

  if (error) {
    return <Error error={error} />;
  }

  if (isLoading) {
    return <Loading />;
  }

  if (!data) {
    return <Loading />;
  }

  const allTrackSummaries = data.trackSummaries;

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

    return true;
  });

  trackSummaries.sort((a, b) => {
    return a.endTime < b.endTime ? 1 : -1;
  });

  const {activities, devices} = getFilterProps(allTrackSummaries);

  return (
    <div>
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

  trackSummaries.forEach(trackSummary => {
    activitiesSet.add(trackSummary.activityType);
    devicesSet.add(trackSummary.device);
  });

  const activities = [...activitiesSet];
  const devices = [...devicesSet];

  activities.sort(stringSort);
  devices.sort(stringSort);

  return {activities, devices}
}

function stringSort(a: string, b: string) {
    if (a === b) {
      return 0;
    }

    return a < b ? 1 : -1;
  }
