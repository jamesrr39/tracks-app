define([
  "handlebars",
  "jquery"
], function(Handlebars, $) {

  var monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December"
  ];

  var daysOfWeek = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday"
  ];

  var trackListingTemplate = Handlebars.compile([
    "{{#trackSummaryDates}}",
      "<div>",
        "<div>",
        "{{dateStr}}",
        "</div>",
        "<div style='overflow:auto'>",
          "{{#trackSummaries}}",
            "<div style='float: left; margin: 5px; background-color: lightblue'>",
              "<a href='#/track/{{encodedTrackName}}'>",
                "<p>{{startTimeStr}}<p>",
              "</a>",
              "<p>{{distanceKm}} Km</p>",
            "</div>",
          "{{/trackSummaries}}",
        "</div>",
    "</div>",
  "{{/trackSummaryDates}}",
  ].join(""));

  return function() {
    return {
      render: function($element) {
        $.ajax("/api/fit/").then(function(summaries) {
          var trackSummaryDatesMap = {}; // [] dayTs[tracks]

          summaries.forEach(function(summary) {
            var summaryTs = new Date(summary.startTime);
            var dayTs = new Date(summaryTs.getFullYear(), summaryTs.getMonth(), summaryTs.getDate()).getTime();

            if (!trackSummaryDatesMap[dayTs]) {
              trackSummaryDatesMap[dayTs] = [];
            }

            trackSummaryDatesMap[dayTs].push(summary)
          });

          var trackSummaryDates = Object.keys(trackSummaryDatesMap).map(function(dayTs) {
            dayTs = parseInt(dayTs, 10);
            var date = new Date(dayTs);

            return {
              dayTs: dayTs,
              dateStr: daysOfWeek[date.getDay()] + ", " + date.getDate() + " " + monthNames[date.getMonth()] + " " + date.getFullYear(),
              trackSummaries: trackSummaryDatesMap[dayTs].map(function(summary) {
                var startDate = new Date(summary.startTime);

                return Object.assign({}, summary, {
                  encodedTrackName: encodeURIComponent(summary.name),
                  startTimestampMs: new Date(summary.startTime).getTime(),
                  distanceKm: (summary.totalDistance / 1000).toFixed(2),
                  startTimeStr: startDate.getHours() + ":" + startDate.getMinutes()
                });
              }).sort(function(a, b){
                if (a.startTimestampMs < b.startTimestampMs) {
                  return 1;
                }
                return -1;
              })
            };
          });

          trackSummaryDates.sort(function(a, b) {
            if (a.dayTs < b.dayTs) {
              return 1;
            }
            return -1;
          });

          $element.html(trackListingTemplate({
            trackSummaryDates: trackSummaryDates
          }));
        }).fail(function(){
          throw new Error("error"); // todo handle
        })
      }
    };
  };

});
