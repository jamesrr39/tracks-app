import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { environment } from './environments/environment';
import { TracksModule } from './app/tracks.module';

if (environment.production) {
  enableProdMode();
}

platformBrowserDynamic().bootstrapModule(TracksModule)
  .catch(err => console.log(err));
