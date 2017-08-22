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
                "{{name}}",
              "</a>",
            "</td>",
          "</tr>",
        "{{/trackSummaries}}",
      "</tbody>",
    "</table>"
  ].join(""));

  return function() {
    return {
      render: function($element) {
        $.ajax("/api/fit/").then(function(summaries) {
          $element.html(trackListingTemplate({
            trackSummaries: summaries.map(function(summary) {
              return Object.assign({}, summary, {
                encodedTrackName: encodeURIComponent(summary.name)
              });
            })
          }));
        }).fail(function(){
          throw new Error("error"); // todo handle
        })
      }
    };
  };

});
