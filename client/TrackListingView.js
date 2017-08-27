define([
  "handlebars",
  "jquery"
], function(Handlebars, $) {

  var trackListingTemplate = Handlebars.compile([
    "<table class='table'>",
      "<tbody>",
        "{{#trackSummaries}}",
          "<tr>",
            "<td>",
              "<a href='#/track/{{encodedTrackName}}'>",
                "{{startTime}}",
              "</a>",
            "</td>",
            "<td>{{distanceKm}} Km</td>",
          "</tr>",
        "{{/trackSummaries}}",
      "</tbody>",
    "</table>"
  ].join(""));

  return function() {
    return {
      render: function($element) {
        $.ajax("/api/fit/").then(function(summaries) {
          var summaries = summaries.map(function(summary) {
            return Object.assign({}, summary, {
              encodedTrackName: encodeURIComponent(summary.name),
              startTimestampMs: new Date(summary.startTime).getTime(),
              distanceKm: summary.totalDistance / 1000
            });
          });
          summaries.sort(function(a, b){
            if (a.startTimestampMs < b.startTimestampMs) {
              return 1;
            }
            return -1;
          });

          $element.html(trackListingTemplate({
            trackSummaries: summaries
          }));
        }).fail(function(){
          throw new Error("error"); // todo handle
        })
      }
    };
  };

});
