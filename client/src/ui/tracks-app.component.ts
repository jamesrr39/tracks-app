import { Component, ViewEncapsulation } from '@angular/core';

@Component({
  selector: "tracks-app",
  template: `
  <nav>
    <a routerLink="/" routerLinkActive="active">
      <h1>Tracks</h1>
    </a>
  </nav>
  <router-outlet></router-outlet>
  `,
  encapsulation: ViewEncapsulation.None,
  styleUrls: [
    "../../node_modules/bootstrap/dist/css/bootstrap.css",
    "../../node_modules/openlayers/dist/ol.css"
  ]
})
export class TracksApp {

}
