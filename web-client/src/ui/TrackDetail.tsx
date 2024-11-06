import { UseQueryResult } from "@tanstack/react-query";
import {
  GetTrackRecordsError,
  useGetTrackRecords,
  useGetTrackSummaryByPath,
} from "../openapi/generated/tracksAppComponents";

import Error from "./Error";
import Loading from "./Loading";
import { MaplibreGLMap } from "./MaplibreGLMap";
import { formatDuration } from "../util/time";
import {
  DomainGeoFileSummary,
  HttphandlersBuildGetTrackDetailResponse,
} from "../openapi/generated/tracksAppSchemas";

function getTypeLinkName(geoFileType: DomainGeoFileSummary["geoFileType"]) {
  switch (geoFileType) {
    case "FIT":
      return "fit";
    case "GPX":
      return "gpx";
    default:
      throw new TypeError(`didn't recognise file type "${geoFileType}"`);
  }
}

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
    relativeFilePath,
    totalDistance,
    endTime,
    startTime,
    // nearbyObjects,
    geoFileType,
    device,
  } = trackSummary;

  const durationMillis =
    new Date(endTime).getTime() - new Date(startTime).getTime();

  return (
    <>
      <div>
        <h1>{name}</h1>
      </div>
      <div>
        {(totalDistance / 1000).toFixed(2)}km in{" "}
        {formatDuration(durationMillis / 1000)}
      </div>
      {device && (
        <div>
          <p>Recorded with {device}</p>
        </div>
      )}
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
    <MaplibreGLMap
      initialBbox={props.trackSummary.activityBounds}
      trackRecords={data.records}
    />
  );
};
