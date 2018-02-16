import { Component, ViewEncapsulation } from '@angular/core';

@Component({
  selector: "tracks-app",
  template: `
  <nav>
    <h1>
      <a routerLink="/" routerLinkActive="active">
        Tracks
      </a>
    </h1>
  </nav>
  <router-outlet></router-outlet>
  `,
  encapsulation: ViewEncapsulation.None,
  styleUrls: [
    "../../../node_modules/bootstrap/dist/css/bootstrap.css",
    "../../../node_modules/openlayers/dist/ol.css"
  ]
})
export class TracksApp {

}
