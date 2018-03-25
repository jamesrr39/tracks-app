import * as React from 'react';
import { Switch, Route } from 'react-router-dom';
import { TrackListing } from './ui/track-listing';
import { TrackView } from './ui/track-view';
// import 'node_modules/bootstrap/dist/css/bootstrap.css';
// import 'bootstrap';

class Header extends React.Component {
  render() {
    return (<h1>Tracks</h1>);
  }
}

class Main extends React.Component {
  render() {
    return (
      <main>
        <Switch>
          <Route exact={true} path="/" component={TrackListing}/>
          <Route path="/tracks/:trackName" component={TrackView}/>
        </Switch>;
      </main >
    );
  }
}

class App extends React.Component {
  render() {
    return (
      <div>
        <Header />
        <Main />
      </div>
    );
  }
}

export default App;
