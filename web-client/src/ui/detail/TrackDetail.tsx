import { UseQueryResult } from "@tanstack/react-query";
import {
  GetTrackRecordsError,
  useGetTrackRecords,
  useGetTrackSummaryByPath,
} from "../../openapi/generated/tracksAppComponents";

import Error from "../Error";
import Loading from "../Loading";
import { MaplibreGLMap } from "../MaplibreGLMap";
import { formatDuration } from "../../util/time";
import {
  DomainGeoFileSummary,
  HttphandlersBuildGetTrackDetailResponse,
} from "../../openapi/generated/tracksAppSchemas";
import TrackChart from "./TrackChart";
import TrackDetailSummary from "./TrackDetailSummary";

export default function TrackDetail(props: { params: { id: string } }) {
  const reactQueryOpts = {
    pathParams: { path: encodeURIComponent(props.params.id) },
  };

  const { error, isLoading, data } = useGetTrackSummaryByPath(reactQueryOpts);

  const mapFetch = useGetTrackRecords(reactQueryOpts);

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
      <div>
        <h1>{name}</h1>
      </div>
      {/* <div>
        {(distanceKm).toFixed(2)}km in{" "}
        {formatDuration(durationSeconds)}
      </div> */}
      {device && (
        <div>
          <p>Recorded with {device}</p>
        </div>
      )}
      <TrackDetailSummary trackSummary={trackSummary} />
      {/* <div>
        <p>Average pace: {formatDuration(Math.round((durationSeconds) / (distanceKm)))} per kilometer</p>
        <p>Average speed: {(distanceKm / durationHours).toFixed(2)}kmh</p>
      </div>
      <div>
        <a
          target="_blank"
          href={`/api/v1/tracks/${encodeURIComponent(
            relativeFilePath
          )}/parsed/${getTypeLinkName(geoFileType)}`}
        >
          Parsed
        </a>{" "}
        |{" "}
        <a
          target="_blank"
          href={`/api/v1/tracks/${encodeURIComponent(relativeFilePath)}/raw`}
        >
          Raw
        </a>
      </div> */}
      <div>
        <ul>
          {/* {nearbyObjects.map((object) => (
            <li>
              {object.tags.name} ({object.tags.place})
            </li>
          ))} */}
        </ul>
      </div>
      <Map fetcherProps={mapFetch} trackSummary={trackSummary} />
    </>
  );
}

type MapProps = {
  fetcherProps: UseQueryResult<
    HttphandlersBuildGetTrackDetailResponse,
    GetTrackRecordsError
  >;
  trackSummary: DomainGeoFileSummary;
};

const Map = (props: MapProps) => {
  const { error, isLoading, data } = props.fetcherProps;

  if (error) {
    return <Error error={error} />;
  }

  if (isLoading || !data) {
    return <Loading />;
  }

  return (
    <div>
      <MaplibreGLMap
        trackSummary={props.trackSummary}
        trackRecords={data.records}
      />
      <TrackChart
        trackSummary={props.trackSummary}
        trackRecords={data.records}
      />
    </div>
  );
};
