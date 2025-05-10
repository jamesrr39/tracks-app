import { DomainGeoFileSummary } from "../../openapi/generated/tracksAppSchemas";
import { formatDistance } from "../../util/distance";
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

function TrackDetailSummary({ trackSummary }: Props) {
    const { geoFileType, relativeFilePath, totalDistance, startTime, endTime } = trackSummary;

    const durationSeconds = getDurationSeconds({ startTime, endTime });
    const durationHours = durationSeconds / (60 * 60);

    const distanceKm = totalDistance / 1000;

    return (
        <>
            <div className="row">
                <DetailItem name="Distance" value={formatDistance(totalDistance)} />
                <DetailItem name="Time" value={formatDuration(durationSeconds)} />
                <DetailItem name="Pace" value={formatDuration(Math.round((durationSeconds) / (distanceKm))) + 'min/km'} />
                <DetailItem name="Average speed" value={`${(distanceKm / durationHours).toFixed(2)} km/h`} />
            </div>
            <div className="row">
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
            </div>
        </>
    )
}


type DetailItemProps = {
    name: string,
    value: string
}

function DetailItem({ name, value }: DetailItemProps) {
    return (
        <div className="col-md-3 col-sm-6">
            {value}
            <br /><small style={{fontSize: '.75em'}}>{name}</small>
        </div>
    );
}


export default TrackDetailSummary;
