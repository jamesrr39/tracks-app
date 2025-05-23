import { DomainGeoFileSummary } from "../../openapi/generated/tracksAppSchemas";
import { formatDistance } from "../../util/distance";
import { formatDuration, getDurationSeconds, getPaceMinPerKm } from "../../util/time";

type Props = {
    trackSummaries: DomainGeoFileSummary[]
}

function TracksListingTable({trackSummaries}: Props) {
    const dateFormatter = new Intl.DateTimeFormat(undefined, {
        dateStyle: 'full'
    });

    return (
        <table className="table">
            <thead>
            </thead>
            <tbody>
                {trackSummaries.map((trackSummary) => {
                    const {name, startTime, totalDistance, relativeFilePath, activityType} = trackSummary;
                    const startDate = new Date(startTime);

                    return (
                        <tr key={trackSummary.hash}>
                            <td>
                                {activityType}
                            </td>
                            <td>
                                {dateFormatter.format(startDate)}
                            </td>
                            <td>
                                <a href={`/tracks/${encodeURIComponent(relativeFilePath)}`}>
                                    {name}
                                </a>
                            </td>
                            <td>
                                {formatDistance(totalDistance)}
                            </td>
                            <td>
                                {formatDuration(getDurationSeconds(trackSummary))}
                            </td>
                            <td>{getPaceMinPerKm(trackSummary)}min/km</td>
                            <td>{trackSummary.device}</td>
                        </tr>
                    );
                })}
            </tbody>
        </table>
    )
}

export default TracksListingTable;
