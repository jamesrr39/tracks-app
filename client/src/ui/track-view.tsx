import * as React from 'react';
import { Track, getDistanceString } from '../domain/track';

import 'ol/ol.css';
// import ol from 'ol';
import Map from 'ol/map';
import View from 'ol/view';
import Tile from 'ol/layer/tile';
import OSM from 'ol/source/osm';
import LineString from 'ol/geom/linestring';
import Feature from 'ol/feature';
import Vector from 'ol/layer/vector';
import SourceVector from 'ol/source/vector';
const proj = require('ol/proj').default;
// import * as SourceVector from 'ol/source/vector';

import Stroke from 'ol/style/stroke';
import Style from 'ol/style/style';
import { SpeedChart } from './speed-chart';
import { getDurationString } from '../utilities/duration';
// import ol from 'ol';
// import * as proj from 'openlayers';
// import { Coordinate } from 'openlayers';

// import * as proj from 'ol/proj';

// interface Proj {
//   fromLonLat(x: number[]): Coordinate;
// }

const drawMap = (track: Track, target: string) => {

  const coords = track.records.map((record) => {
    return [record.posLong, record.posLat];
  }) as [number, number][];

  const lineString = new LineString(coords);
  lineString.transform('EPSG:4326', 'EPSG:3857');

  const feature = new Feature({
    geometry: lineString,
    name: 'line'
  });

  const lineStyle = new Style({
    stroke: new Stroke({
      color: '#0000ff',
      width: 4
    })
  });

  const vector = new Vector({
    source: new SourceVector({
      features: [feature]
    }),
    style: lineStyle
  });

  // tslint:disable-next-line
  console.log(vector);

  // console.log(proj);

  return new Map({
    layers: [
      new Tile({
        source: new OSM()
      }),
      new Vector({
        source: new SourceVector({
          features: [feature]
        }),
        style: lineStyle
      })
    ],
    target: target,
    view: new View({
      center: proj.fromLonLat([
        (track.activityBounds.longMin + track.activityBounds.longMax) / 2,
        (track.activityBounds.latMin + track.activityBounds.latMax) / 2,
      ]),
      resolution: 20
    })
  });
};

interface Route {
  match: {
    path: string;
    params: {
      trackName: string;
    }
  };
  location: {};
  history: {};
}

type TrackViewState = {
  track: Track|null
};

type TrackMapProps = {
  track: Track
};

class TrackMap extends React.Component<TrackMapProps> {
  map: Map|null = null;

  renderMap = () => {
    this.map = drawMap(this.props.track, 'map');
    // this.map = new Map({
    //     view: new View({
    //         center: [0, 0],
    //         zoom: 1
    //     }),
    //     layers: [
    //         new Tile({
    //           source: new OSM()
    //             // source: new ol.source.OSM()
    //         })
    //     ],
    //     target: 'map'
    // });
  }
  render() {
    return (
      <div>
        <div id="map" style={{width: '100%', height: '600px'}} ref={this.renderMap} />
        <SpeedChart track={this.props.track} />
      </div>
    );
  }
}

export class TrackView extends React.Component<Route, TrackViewState> {
  state = {
    track: null
  };

  componentWillMount() {
    const url = `//localhost:8090/api/tracks/file?filePath=${encodeURIComponent(this.props.match.params.trackName)}`;
    fetch(url).then(resp => {
      resp.json().then((track: Track) => {
        track.summary.startTime = new Date(track.summary.startTime);
        track.summary.endTime = new Date(track.summary.endTime);

        track.records.forEach((record) => {
          record.timestamp = new Date(record.timestamp);
        });

        this.setState({
          track
        });
      });
    });
  }

  render() {
    let {track} = this.state;

    if (track === null) {
      return (<p>Loading</p>);
    }

    const t = (track as Track);
    const durationStr = getDurationString(t.summary.startTime, t.summary.endTime);
    const distance = getDistanceString(t.summary);
    const durationSeconds = (t.summary.endTime.getTime() - t.summary.startTime.getTime()) / 1000;
    const avSpeedMetresPerSecond = t.summary.totalDistance / durationSeconds;
    const avSpeedKph = (avSpeedMetresPerSecond * 3600 / 1000).toFixed(2);

    return (
      <div>
        {distance} in {durationStr} ({avSpeedKph} Km/h)
        <TrackMap track={track} />
        </div>
      );
  }
}
