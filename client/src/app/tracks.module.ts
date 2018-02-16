import { NgModule }      from '@angular/core';
import { HttpModule } from '@angular/http';
import { BrowserModule } from '@angular/platform-browser';

import { RouterModule, Routes } from '@angular/router';


import { TracksApp } from './ui/tracks-app.component';
import { TrackListing } from './ui/track-listing.component';
import { TrackView } from './ui/track-view.component';

import { TrackService } from './service/track.service';
import { TrackListingSummary } from './ui/track-summary.component';

const appRoutes: Routes = [
  {
    path: 'tracks/:name',
    component: TrackView },
  {
    path: 'tracks',
    component: TrackListing,
    data: { title: 'Tracks' }
  },
  {
    path: '',
    redirectTo: 'tracks',
    pathMatch: 'full'
  }
  //{ path: '**', component: PageNotFoundComponent }
];

@NgModule({
	imports: [BrowserModule, HttpModule, RouterModule.forRoot(appRoutes, {useHash: true})],
	declarations: [TracksApp, TrackListing, TrackView, TrackListingSummary],
  bootstrap: [TracksApp],
  providers: [TrackService]
})
export class TracksModule { }
