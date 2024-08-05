import { useGetAllTrackSummaries } from "../openapi/generated/tracksAppComponents";

export default function TracksGallery() {
  const { error, isLoading, data } = useGetAllTrackSummaries({});

  if (error) {
    return (
      <div className="alert alert-danger">
        Error loading tracks: {error || "unknown error"}
      </div>
    );
  }

  if (isLoading || !data) {
    return <div className="alert alert-info">Loading</div>;
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
        {data.trackSummaries?.map((track) => (
          <tr>
            <td>{track.name}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
