requirejs.config({
  paths: {
    jquery: "libs/jquery-3.2.1",
    handlebars: "libs/handlebars-4.0.10",
    openlayers: "libs/openlayers-v4.3.1-dist/ol"
  }
});

define([
  "jquery",
  "./TrackListingView",
  "./TrackView"
], function($, TrackListingView, TrackView){

  var trackListingView = new TrackListingView();

  var $contentEl = $("#content");

	window.onhashchange = function(){
		var hashFragments = window.location.hash.substring(2).split("/"); // remove the '#/' at the start of the hash
    var trackName;

    switch (hashFragments[0]) {
      case "track":
        trackName = decodeURIComponent(hashFragments[1]);
        new TrackView(trackName).render($contentEl);
        return;
      default:
        trackListingView.render($contentEl);
        break;
    }
	}

	// render start screen depending on start hash location
	window.onhashchange();
});
