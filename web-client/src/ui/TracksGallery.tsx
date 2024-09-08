import { useGetAllTrackSummaries } from "../openapi/generated/tracksAppComponents";
import Error from "./Error";
import Loading from "./Loading";

export default function TracksGallery() {
  const { error, isLoading, data } = useGetAllTrackSummaries({});

  if (error) {
    return <Error error={error} />;
  }

  if (isLoading || !data) {
    return <Loading />;
  }

  console.log(data);
  return (
    <table className="table table-striped">
      <thead>
        <tr>
          <th>Name</th>
        </tr>
      </thead>
      <tbody>
        {data.trackSummaries.map((track) => (
          <tr>
            <td>
              <a href={`/tracks/${encodeURIComponent(track.name)}`}>
                {track.name}
              </a>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
