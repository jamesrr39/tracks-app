import { useGetAllTrackSummaries } from "../openapi/generated/tracksAppComponents";
import { formatDistance } from "../util/distance";
import { formatDuration, getDurationSeconds } from "../util/time";
import Error from "./Error";
import Loading from "./Loading";

const styles = {
  dataTag: {
    background: "grey",
    margin: "10px",
    padding: "5px",
    borderRadius: "5px",
  },
  list: {
    listStyleType: "none",
  },
  listItem: {
    margin: "20px",
    backgroundColor: "lightgrey",
  },
};

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

  data.trackSummaries.sort((a, b) => {
    return a.endTime < b.endTime ? 1 : -1;
  });

  return (
    <div>
      <ul style={styles.list}>
        {data.trackSummaries.map((track, idx) => (
          <li style={styles.listItem} key={idx}>
            <a href={`/tracks/${encodeURIComponent(track.relativeFilePath)}`}>
              {track.name}
            </a>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <div style={styles.dataTag}>
                {formatDistance(track.totalDistance)}
              </div>
              <div style={styles.dataTag}>
                {formatDuration(getDurationSeconds(track))}
              </div>
            </div>
          </li>
        ))}
      </ul>
      {data.trackSummaries.length === 0 && <p>No tracks found</p>}
    </div>
  );
}
