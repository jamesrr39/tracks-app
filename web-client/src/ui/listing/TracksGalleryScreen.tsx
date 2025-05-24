import { useGetAllTrackSummaries } from "../../openapi/generated/tracksAppComponents";
import Error from "../Error";
import Loading from "../Loading";
import TracksGallery from "./TracksGallery";



export default function TracksGalleryScreen() {
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

  return <TracksGallery allTrackSummaries={data.trackSummaries} />
}