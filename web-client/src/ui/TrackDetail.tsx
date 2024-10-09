import { UseQueryResult } from "@tanstack/react-query";
import {
  GetTrackRecordError,
  useGetTrackRecord,
  useGetTrackSummaryByPath,
} from "../openapi/generated/tracksAppComponents";
import {
  DomainFitFileSummary,
  HttphandlersBuildGetTrackDetailResponse,
} from "../openapi/generated/tracksAppSchemas";
import Error from "./Error";
import Loading from "./Loading";
import { MaplibreGLMap } from "./MaplibreGLMap";
import { formatDuration } from "../util/time";

export default function TrackDetail(props: { params: { id: string } }) {
  const reactQueryOpts = {
    pathParams: { path: encodeURIComponent(props.params.id) },
  };

  const { error, isLoading, data } = useGetTrackSummaryByPath(reactQueryOpts);

  const mapFetch = useGetTrackRecord(reactQueryOpts);

  if (error) {
    return <Error error={error} />;
  }

  if (isLoading || !data) {
    return <Loading />;
  }

  const { trackSummary } = data;

  const {
    name,
    totalDistance,
    endTime,
    startTime,
    nearbyObjects,
    deviceManufacturer,
    deviceProduct,
  } = trackSummary;

  const durationMillis =
    new Date(endTime).getTime() - new Date(startTime).getTime();

  console.log("track props", props);
  return (
    <>
      <div>
        <h1>{name}</h1>
      </div>
      <div>
        {(totalDistance / 1000).toFixed(2)}km in{" "}
        {formatDuration(durationMillis / 1000)}
      </div>
      {(deviceManufacturer || deviceProduct) && (
        <div>
          <p>
            Recorded with {deviceManufacturer} {deviceProduct}
          </p>
        </div>
      )}
      <div>
        <ul>
          {nearbyObjects.map((object) => (
            <li>
              {object.tags.name} ({object.tags.place})
            </li>
          ))}
        </ul>
      </div>
      <Map fetcherProps={mapFetch} trackSummary={trackSummary} />
    </>
  );
}

type MapProps = {
  fetcherProps: UseQueryResult<
    HttphandlersBuildGetTrackDetailResponse,
    GetTrackRecordError
  >;
  trackSummary: DomainFitFileSummary;
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
