import * as React from 'react';
import { TrackListing } from './ui/track-listing';
// import 'node_modules/bootstrap/dist/css/bootstrap.css';
// import 'bootstrap';

class App extends React.Component {
  render() {
    return (
      <div>
        <h1>Tracks</h1>
        <TrackListing />
      </div>
    );
  }
}

export default App;
