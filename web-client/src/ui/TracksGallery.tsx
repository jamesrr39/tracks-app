import { useGetAllTrackSummaries } from "../openapi/generated/tracksAppComponents";

export function TracksGallery() {
  const tracks = useGetAllTrackSummaries({});
  console.log(tracks);
  return <p>Tracks...</p>;
}
