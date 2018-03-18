import * as React from 'react';
import { TrackSummary } from '../domain/track';

export class TrackListing extends React.Component {
  state = {
    trackSummaries: [],
    isLoaded: false,
  };

  componentWillMount() {
    if (this.state.isLoaded === false) {
      fetch('//localhost:8090/api/tracks/').then((resp) => {
        resp.json().then(trackSummaries => {
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
      const nearbyObjectsElements = trackSummary.nearbyObjects.map((nearbyObject, objectIndex) => {
        const content = (nearbyObject.tags.isIn)
          ? `${nearbyObject.tags.name} ({nearbyObject.tags.isIn})`
          : nearbyObject.tags.name;

        return <p key={objectIndex}>{content}</p>;
      });
      return (
        <div key={index}>
          {trackSummary.name}
          {nearbyObjectsElements}
        </div>
      );
    });

    return (
      <div>{summaryThumbnails}</div>
    );
  }
}
