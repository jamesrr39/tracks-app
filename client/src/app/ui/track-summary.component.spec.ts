import { TestBed, async } from '@angular/core/testing';
import { RouterModule } from '@angular/router';

import { Component } from '@angular/core';
import { TrackListingSummary } from './track-summary.component';
import { TrackSummary } from '../domain/track';

class MockRouter {
    //noinspection TypeScriptUnresolvedFunction
    navigate = jasmine.createSpy('navigate');
}

let mockRouter: MockRouter;

describe('TrackListingSummary', () => {
  beforeEach(async(() => {
    mockRouter = new MockRouter();

    TestBed.configureTestingModule({
      declarations: [
        TrackListingSummary
      ],
    }).compileComponents();
  }));
  it('should create the app', async(() => {
    const fixture = TestBed.createComponent(TrackListingSummary);
    fixture.componentInstance.trackSummary = new TrackSummary(
      "test track",
      new Date(2000, 1, 1),
      new Date(2000, 1, 2),
      "test device manufacturer",
      "test device product",
      10000, // 10km
      [],
      [],
    );

    const app = fixture.debugElement.componentInstance;

    expect(app).toBeTruthy();
  }));

  // it(`should have as title 'app'`, async(() => {
  //   const fixture = TestBed.createComponent(AppComponent);
  //   const app = fixture.debugElement.componentInstance;
  //   expect(app.title).toEqual('app');
  // }));
  // it('should render title in a h1 tag', async(() => {
  //   const fixture = TestBed.createComponent(AppComponent);
  //   fixture.detectChanges();
  //   const compiled = fixture.debugElement.nativeElement;
  //   expect(compiled.querySelector('h1').textContent).toContain('Welcome to app!');
  // }));
});
