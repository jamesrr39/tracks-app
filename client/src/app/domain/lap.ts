import { getDurationString } from './duration';

export class Lap {
 constructor(public startTime, public endTime: Date, public distanceInLapMetres, public cumulativeDistanceMetres, public startAltitude, public endAltitude: number){}

 getDurationString() {
   return getDurationString(this.startTime, this.endTime);
 }
}
