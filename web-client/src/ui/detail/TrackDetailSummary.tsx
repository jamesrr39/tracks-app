import { DomainGeoFileSummary } from "../../openapi/generated/tracksAppSchemas";
import { formatDuration, getDurationSeconds } from "../../util/time";

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

type Props = {
    trackSummary: DomainGeoFileSummary
}

function TrackDetailSummary({trackSummary}: Props) {
    const { geoFileType, relativeFilePath, totalDistance, startTime, endTime } = trackSummary;

    const durationSeconds = getDurationSeconds({startTime, endTime});
    const durationHours = durationSeconds / (60 * 60);

    const distanceKm = totalDistance / 1000;

    return (
        <>
            <div>
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
            </div>
        </>
    )
}

export default TrackDetailSummary;
