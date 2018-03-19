import * as React from 'react';
import { TrackSummary } from '../domain/track';
import { TrackThumbnail } from './track-listing-thumbnail';

export class TrackListing extends React.Component {
  state = {
    trackSummaries: [],
    isLoaded: false,
  };

  componentWillMount() {
    if (this.state.isLoaded === false) {
      fetch('//localhost:8090/api/tracks/').then((resp) => {
        resp.json().then((trackSummaries: TrackSummary[]) => {
          trackSummaries.forEach(trackSummary => {
            trackSummary.startTime = new Date(trackSummary.startTime);
            trackSummary.endTime = new Date(trackSummary.endTime);
          });

          trackSummaries.sort((a: TrackSummary, b: TrackSummary) => {
            if (a.startTime === b.startTime) {
              return 0;
            }
            return (a.startTime > b.startTime) ? -1 : 1;
          });
          this.setState({
            trackSummaries,
            isLoaded: true,
          });
        });
      });
    }
  }
  render() {
    if (this.state.isLoaded === false) {
      return (<p>Loading</p>);
    }

    const summaryThumbnails = this.state.trackSummaries.map((trackSummary: TrackSummary, index) => {
      return <TrackThumbnail trackSummary={trackSummary} key={index} />;
    });

    return (
      <div>{summaryThumbnails}</div>
    );
  }
}
