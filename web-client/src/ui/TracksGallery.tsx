import { useGetAllTrackSummaries } from "../openapi/generated/tracksAppComponents";
import { formatDistance } from "../util/distance";
import { formatDuration, getDurationSeconds } from "../util/time";
import Error from "./Error";
import Loading from "./Loading";

export default function TracksGallery() {
  const { error, isLoading, data } = useGetAllTrackSummaries({});

  if (error) {
    return <Error error={error} />;
  }

  if (isLoading) {
    return <Loading />;
  }

  if (!data) {
    return <Loading />;
  }

  console.log(data);
  return (
    <div>
      <ul>
        {data.trackSummaries.map((track, idx) => (
          <li key={idx}>
            <a href={`/tracks/${encodeURIComponent(track.name)}`}>
              {track.name}
            </a>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>{formatDistance(track.totalDistance)}</span>
              <span>{formatDuration(getDurationSeconds(track))}</span>
            </div>
          </li>
        ))}
      </ul>
      {data.trackSummaries.length === 0 && <p>No tracks found</p>}
    </div>
  );
}
