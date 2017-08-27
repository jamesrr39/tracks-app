define([
  "handlebars",
  "jquery",
  "openlayers"
], function(Handlebars, $, OpenLayers) {

  var trackTemplate = Handlebars.compile([
    "<div>",
      "<h2>{{startDateStr}} ({{durationStr}})</h2>",
      "<p>{{name}}</p>",
      "<p>Recorded with {{deviceStr}}</p>",
      "<p>{{distanceKm}} Km</p>",
      "<div style='width: 100%; height:600px;' class='map-container'></div>",
/*
      "<table class='table'>",
        "<thead>",
          "<tr>",
            "<th>Total Elapsed Time (s)</th>",
            "<th>Total Timer Time (s)</th>",
            "<th>Total Distance (m)</th>",
          "</tr>",
        "</thead>",
          "<tbody>",
          "{{#records}}",
            "<tr>",
            "<td>{{Total_elapsed_time}}</td>",
            "<td>{{Total_timer_time}}</td>",
            "<td>{{Total_distance}}</td>",
            "</tr>",
          "{{/records}}",
        "</tbody>",
      "</table>",
      */
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

          var $mapContainer = $element.find(".map-container");

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
            target: $mapContainer.get(0),
            //renderer: "canvas",
            view: new OpenLayers.View({
              center: OpenLayers.proj.fromLonLat([37.41, 8.82]),
              zoom: 4
            })
          });
        }).fail(function(){
          throw new Error("error"); // todo handle
        })
      }
    };
  };

});
