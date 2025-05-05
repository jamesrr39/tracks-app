import { DomainGeoFileSummary } from "../../openapi/generated/tracksAppSchemas";
import { formatDistance } from "../../util/distance";
import { formatDuration, getDurationSeconds } from "../../util/time";

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

type Props = {
    trackSummaries: DomainGeoFileSummary[]
}

export default function TracksListing({trackSummaries}: Props) {
  return (
    <div>
      <ul style={styles.list}>
        {trackSummaries.map((track, idx) => (
          <li style={styles.listItem} key={idx}>
            {track.activityType}
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
    </div>
  );
}
