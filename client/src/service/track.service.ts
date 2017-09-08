import { Injectable } from '@angular/core';
import { Http, Response, Headers, RequestOptions } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import '../rxjs-operators';

import { Track, TrackSummary } from '../domain/track';
import { Record } from '../domain/record';
import { ActivityBounds } from '../domain/activityBounds';
import { Lap } from '../domain/lap';

@Injectable()
export class TrackService {
    constructor(private http: Http){}

    fetchAllSummaries(): Observable<TrackSummary[]> {
      return this.http.get("/api/tracks/").map((r: Response) => {
        return r.json().map((responseObject) => {
          return TrackService.trackSummaryFromJSObject(responseObject);
        });
      });
    }

    fetchTrack(name: string): Observable<Track> {
      return this.http.get("/api/tracks/file?filePath=" + encodeURIComponent(name)).map((r: Response) => {
        const responseObject = r.json();

        const records = responseObject.records.map((recordObject) => {
          return new Record(
            new Date(recordObject.timestamp),
            recordObject.posLat,
            recordObject.posLong,
            recordObject.distance,
            recordObject.altitude
          );
        });

        const activityBounds = new ActivityBounds(
          responseObject.activityBounds.latMin,
          responseObject.activityBounds.latMax,
          responseObject.activityBounds.longMin,
          responseObject.activityBounds.longMax
        );

        return new Track(
          TrackService.trackSummaryFromJSObject(responseObject.summary),
          records,
          activityBounds
        );
      });
    }

    fetchLaps(trackName: string): Observable<Lap[]> {
      return this.http.get("/api/tracks/laps?filePath=" + trackName).map((r: Response) => {
          const responseObject = r.json();

          return responseObject.map((lapObject) => {
            return new Lap(
              new Date(lapObject.startTimestamp),
              new Date(lapObject.endTimestamp),
              lapObject.distanceInLapMetres,
              lapObject.cumulativeDistanceMetres,
              lapObject.startAltitude,
              lapObject.endAltitude
            );
          });
      });
    }

    private static trackSummaryFromJSObject(responseObject: any): TrackSummary {
      return new TrackSummary(
        responseObject.name,
        new Date(responseObject.startTime),
        new Date(responseObject.endTime),
        responseObject.deviceManufacturer,
        responseObject.deviceProduct,
        responseObject.totalDistance
      );
    }

  }
