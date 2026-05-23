import { UseQueryResult } from "@tanstack/react-query";
import {
  GetTrackRecordsError,
  useGetTrackRecords,
  useGetTrackSummaryByPath,
} from "../../openapi/generated/tracksAppComponents";

import Error from "../Error";
import Loading from "../Loading";
import { MaplibreGLMap } from "../map/MaplibreGLMap";
import {
  DomainGeoFileSummary,
  HttphandlersBuildGetTrackDetailResponse,
} from "../../openapi/generated/tracksAppSchemas";
import TrackChart from "./TrackChart";
import TrackDetailSummary from "./TrackDetailSummary";
import Breadcrumb from "../breadcrumb/Breadcrumb";

export default function TrackDetail(props: { params: { id: string } }) {
  const reactQueryOpts = {
    pathParams: { path: encodeURIComponent(props.params.id) },
  };

  const { error, isLoading, data } = useGetTrackSummaryByPath(reactQueryOpts);

  if (error) {
    return <Error error={error} />;
  }

  if (isLoading || !data) {
    return <Loading />;
  }

  const { trackSummary } = data;

  const {
    name,
    // nearbyObjects,
    device,
  } = trackSummary;



  return (
    <>
      <Breadcrumb pathFragments={["tracks", props.params.id]} />
      <div>
        <h1>{name}</h1>
      </div>
      {device && (
        <div>
          <p>Recorded with {device}</p>
        </div>
      )}
      <div style={{borderBottom: '1px solid #DEDDDA'}}>
      <TrackDetailSummary trackSummary={trackSummary} />
      </div>
      <div>
        <ul>
          {/* {nearbyObjects.map((object) => (
            <li>
              {object.tags.name} ({object.tags.place})
            </li>
          ))} */}
        </ul>
      </div>
      <Map trackSummary={trackSummary} />
    </>
  );
}

type MapProps = {
  // fetcherProps: UseQueryResult<
  //   HttphandlersBuildGetTrackDetailResponse,
  //   GetTrackRecordsError
  // >;
  trackSummary: DomainGeoFileSummary;
};

const Map = (props: MapProps) => {
  const { error, isLoading, data } = useGetTrackRecords({
    pathParams: { path: encodeURIComponent(props.trackSummary.relativeFilePath) },
  });
  // const { error, isLoading, data } = props.fetcherProps;
console.log('data', error)
  if (error) {
    return <Error error={error} />;
  }

  if (isLoading) {
    return <Loading />;
  }

  if (!data) {
    return null;
  }

  return (
    <div>
      <h2>Map</h2>
      <MaplibreGLMap
        trackSummary={props.trackSummary}
        trackRecords={data.records}
      />
      <h2>Data</h2>
      <TrackChart
        trackSummary={props.trackSummary}
        trackRecords={data.records}
      />
    </div>
  );
};
