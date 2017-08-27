define([
  "handlebars",
  "jquery",
  "openlayers"
], function(Handlebars, $, OpenLayers) {

  var lapsTemplate = Handlebars.compile([
    "<table class='table'>",
      "<thead>",
        "<tr>",
          "<th>Time (s)</th>",
          "<th>Distance (m)</th>",
          "<th>Total Distance Covered (m)</th>",
          "<th>Start Altitude (m)</th>",
          "<th>End Altitude (m)</th>",
          "<th>Altitude Gain (m)</th>",
        "</tr>",
      "</thead>",
        "<tbody>",
        "{{#laps}}",
          "<tr>",
          "<td>{{timeTakenStr}}</td>",
          "<td>{{distanceInLapMetres}}</td>",
          "<td>{{cumulativeDistanceMetres}}</td>",
          "<td>{{startAltitude}}</td>",
          "<td>{{endAltitude}}</td>",
          "<td>{{altitudeGain}}</td>",
          "</tr>",
        "{{/laps}}",
      "</tbody>",
    "</table>"
  ].join(""));

  var trackTemplate = Handlebars.compile([
    "<div>",
      "<h2>{{startDateStr}} ({{durationStr}})</h2>",
      "<p>{{name}}</p>",
      "<p>Recorded with {{deviceStr}}</p>",
      "<p>{{distanceKm}} Km</p>",
      "<div style='width: 100%; height:600px;' class='map-container'></div>",
      "<div class='laps-container'>Loading laps...</div>",
    "</div>"
  ].join(""));

  function formatDuration(durationSeconds) {
    var durationHours = Math.floor(durationSeconds / (60 * 60));
    var durationMinutes = Math.floor(durationSeconds / 60) - (durationHours * 60);
    var leftOverSeconds = durationSeconds - ((durationHours * 60 * 60) + (durationMinutes * 60))

    var s = leftOverSeconds + "s";
    if (durationMinutes) {
      s = durationMinutes + "m " + s;
    }
    if (durationHours) {
      s = durationHours + "h " + s;
    }
    return s;
  }

  function createMap(container, track) {
    var waypoints = new OpenLayers.layer.Vector({
      source: new OpenLayers.source.Vector({
        features: track.records.map(function(record) {
          var coords = OpenLayers.proj.transform([
            record.posLong,
            record.posLat
          ], "EPSG:4326", "EPSG:3857")

          var feature = new OpenLayers.Feature({
            geometry: new OpenLayers.geom.Point(coords),
            name: record.distance
          });

          return feature;
        })
      })
    });

    var map = new OpenLayers.Map({
      layers: [
        new OpenLayers.layer.Tile({
          source: new OpenLayers.source.OSM()
        }),
        waypoints
      ],
      /*controls: OpenLayers.control.defaults({
        attributionOptions: {
          collapsible: false
        }
      }),*/
      target: container,
      //renderer: "canvas",
      view: new OpenLayers.View({
        center: OpenLayers.proj.fromLonLat([
          (track.activityBounds.longMin + track.activityBounds.longMax) / 2,
          (track.activityBounds.latMin + track.activityBounds.latMax) / 2,
        ]),
        resolution: 20
      })
    });
  }

  return function(trackName) {
    return {
      render: function($element) {
        $.ajax("/api/fit/" + encodeURIComponent(trackName)).then(function(track) {
          var deviceProduct = track.summary.deviceProduct || "(Unknown Product)";
          var startDate = new Date(track.summary.startTime);
          var endDate = new Date(track.summary.endTime);
          var durationSeconds = Math.floor((endDate.getTime() - startDate.getTime()) / 1000);

          $element.html(trackTemplate({
            startDateStr: startDate.toString("YYYY-MM-DD"),
            durationStr: formatDuration(durationSeconds),
            name: trackName,
            deviceStr: track.summary.deviceManufacturer + " :: " +  deviceProduct,
            records: track.records,
            distanceKm: track.summary.totalDistance / 1000
          }));

          // load laps
          $.ajax("/api/fit/" + encodeURIComponent(trackName) + "/laps").then(function(laps) {
            $element.find(".laps-container").html(lapsTemplate({
              laps: laps.map(function(lap) {
                lap.timeTakenStr = formatDuration((new Date(lap.endTimestamp).getTime() - new Date(lap.startTimestamp).getTime()) / 1000),
                lap.altitudeGain = Math.round(lap.endAltitude - lap.startAltitude);

                return lap;
              })
            }));
          }).fail(function() {
            throw new Error("failed to build the laps listing")
          });


          createMap($element.find(".map-container").get(0), track);

        }).fail(function(){
          throw new Error("error"); // todo handle
        })
      }
    };
  };

});
