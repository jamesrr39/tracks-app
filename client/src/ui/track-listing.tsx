import * as React from 'react';
import { TrackSummary } from '../domain/track';
import { TrackThumbnail } from './track-listing-thumbnail';

const styles = {
  container: {
    display: 'flex',
    flexWrap: 'wrap',
  } as React.CSSProperties
};

const sort = (a: number, b: number) => {
  if (a === b) {
    return 0;
  }
  return (a > b) ? -1 : 1;
};

interface Sorter {
  name: string;
  sort(a: TrackSummary, b: TrackSummary): number;
}

const sortByDate = {
  name: 'Date',
  sort: (a: TrackSummary, b: TrackSummary) => {
    return sort(a.startTime.getTime(), b.startTime.getTime());
  },
};

const sortByDistance = {
  name: 'Km',
  sort: (a: TrackSummary, b: TrackSummary) => {
    return sort(a.totalDistance, b.totalDistance);
  },
};

type State = {
  trackSummaries: TrackSummary[],
  isLoaded: boolean,
  listingSortType: Sorter,
};

export class TrackListing extends React.Component<{}, State> {
  state = {
    trackSummaries: [],
    isLoaded: false,
    listingSortType: sortByDate,
  };

  componentWillMount() {
    if (this.state.isLoaded === false) {
      fetch('//localhost:8090/api/tracks/').then((resp) => {
        resp.json().then((trackSummaries: TrackSummary[]) => {
          trackSummaries.forEach(trackSummary => {
            trackSummary.startTime = new Date(trackSummary.startTime);
            trackSummary.endTime = new Date(trackSummary.endTime);
          });

          this.setState({
            trackSummaries,
            isLoaded: true,
          });
        });
      });
    }
  }

  setSorter = (sorter: Sorter) => {
    this.setState({
      listingSortType: sorter,
    });
  }

  render() {
    const { isLoaded, listingSortType } = this.state;

    if (isLoaded === false) {
      return (<p>Loading</p>);
    }

    const trackSummaries = [].concat(this.state.trackSummaries);

    trackSummaries.sort(listingSortType.sort);

    const summaryThumbnails = trackSummaries.map((trackSummary: TrackSummary, index) => {
      return <TrackThumbnail trackSummary={trackSummary} key={index} />;
    });

    const sorters = [sortByDate, sortByDistance].map((sorter, i) => {
      return (
        <a key={i} href="#" className="dropdown-item" onClick={() => this.setSorter(sorter)}>
          {sorter.name}
        </a>
      );

    });

    return (
      <div>
        <div className="dropdown">
          <button
            className="btn btn-default dropdown-toggle"
            type="button"
            data-toggle="dropdown"
            aria-haspopup="true"
            aria-expanded="false"
          >
            {listingSortType.name}
          </button>
          <div className="dropdown-menu" aria-labelledby="dropdownMenuButton">
            {sorters}
          </div>
        </div>
        <div style={styles.container}>
        {summaryThumbnails}
        </div>
      </div>
    );
  }
}
