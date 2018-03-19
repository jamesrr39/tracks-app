import * as React from 'react';
import { TrackSummary, getTrackDurationString, getDistanceString } from '../domain/track';

type TrackThumbnailProps = {
  trackSummary: TrackSummary
};

export class TrackThumbnail extends React.Component<TrackThumbnailProps> {
  render() {
    const nearbyObjectsElements = this.props.trackSummary.nearbyObjects.map((nearbyObject, objectIndex) => {
      const content = (nearbyObject.tags.isIn)
        ? `${nearbyObject.tags.name} ({nearbyObject.tags.isIn})`
        : nearbyObject.tags.name;

      return <li key={objectIndex}>{content}</li>;
    });
    return (
      <div style={{backgroundColor: '#2C7'}}>
        <p>{this.props.trackSummary.name}</p>
        <p>{getDistanceString(this.props.trackSummary)}
        &nbsp;in {getTrackDurationString(this.props.trackSummary)}
        &nbsp;on {this.props.trackSummary.startTime.toUTCString()}</p>
        <ul className="list-unstyled">
          {nearbyObjectsElements}
        </ul>
      </div>
    );
  }
}
