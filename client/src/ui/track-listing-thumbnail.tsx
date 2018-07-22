import * as React from 'react';
import { TrackSummary, getTrackDurationString, getDistanceString } from '../domain/track';
import { Link } from 'react-router-dom';

type TrackThumbnailProps = {
  trackSummary: TrackSummary
};

const styles = {
  container: {
    backgroundColor: '#ddd',
    margin: '10px',
    minWidth: '250px',
  },
  nearbyObjectsList: {
    maxHeight: '100px',
    overflow: 'auto',
  } as React.CSSProperties
};

export class TrackThumbnail extends React.Component<TrackThumbnailProps> {
  render() {
    const nearbyObjectsElements = this.props.trackSummary.nearbyObjects.map((nearbyObject, objectIndex) => {
      const content = (nearbyObject.tags.isIn)
        ? `${nearbyObject.tags.name} ({nearbyObject.tags.isIn})`
        : nearbyObject.tags.name;

      return <li key={objectIndex}>{content}</li>;
    });

    const trackViewLink = `/tracks/${encodeURIComponent(this.props.trackSummary.name)}`;

    return (
      <div style={styles.container}>
        <Link to={trackViewLink}>
          <p>{this.props.trackSummary.name}</p>
        </Link>
        <p>{getDistanceString(this.props.trackSummary)}
        &nbsp;in {getTrackDurationString(this.props.trackSummary)}
        &nbsp;on {this.props.trackSummary.startTime.toUTCString()}</p>
        <ul style={styles.nearbyObjectsList} className="list-unstyled">
          {nearbyObjectsElements}
        </ul>
      </div>
    );
  }
}
