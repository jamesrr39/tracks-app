import { useState } from "preact/hooks";
import { useGetAllTrackSummaries } from "../../openapi/generated/tracksAppComponents";
import Error from "../Error";
import Loading from "../Loading";
import TracksListing from "./TracksList";
import TracksListingTable from "./TracksListingTable";

export default function TracksGallery() {
  const [displayStyle, setDisplayStyle] = useState<'list' | 'table'>("list");
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

  const {trackSummaries} = data;

  if (trackSummaries.length === 0) {
    return <p>No tracks found</p>
  }

  trackSummaries.sort((a, b) => {
    return a.endTime < b.endTime ? 1 : -1;
  });

  return (
    <div>
      <button onClick={event =>{
        event.preventDefault();
        setDisplayStyle(displayStyle => {
          return displayStyle === 'list' ? 'table' : 'list';
        })
      }}>Change list style</button>
      {displayStyle === 'list' && <TracksListing trackSummaries={trackSummaries} />}
      {displayStyle === 'table' && <TracksListingTable trackSummaries={trackSummaries} />}
    </div>
  );
}
