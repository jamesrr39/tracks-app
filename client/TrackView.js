define([
  "handlebars",
  "jquery",
  "openlayers"
], function(Handlebars, $, OpenLayers) {

  var trackTemplate = Handlebars.compile([
    "<div>",
      "<h2>{{name}}</h2>",
      "<p>Recorded with {{deviceStr}}</p>",
      "{{#keys}}",
        "{{.}}",
      "{{/keys}}",
      "<div style='width: 100%; height:600px;' class='map-container'></div>",
      "<table class='table'>",
        "<thead>",
          "<tr>",
            "<th>Total Elapsed Time (s)</th>",
            "<th>Total Timer Time (s)</th>",
            "<th>Total Distance (m)</th>",
          "</tr>",
        "</thead>",
          "<tbody>",
          "{{#laps}}",
            "<tr>",
            "<td>{{Total_elapsed_time}}</td>",
            "<td>{{Total_timer_time}}</td>",
            "<td>{{Total_distance}}</td>",
            "</tr>",
          "{{/laps}}",
        "</tbody>",
      "</table>",
    "</div>"
  ].join(""));

  return function(trackName) {
    return {
      render: function($element) {
        $.ajax("/api/fit/" + encodeURIComponent(trackName)).then(function(track) {
          $element.html(trackTemplate({
            name: trackName,
            keys: Object.keys(track),
            deviceStr: track.FileId.Manufacturer + " :: " + track.FileId.Product,
            laps: track.Laps
          }));

          var $mapContainer = $element.find(".map-container");

          var waypoints = new OpenLayers.layer.Vector({
            source: new OpenLayers.source.Vector({
              features: track.Records.map(function(record) {
                var coords = OpenLayers.proj.transform([
                  record.Position_long,
                  record.Position_lat
                ], "EPSG:4326", "EPSG:3857")
//], "EPSG:4326", "EPSG:4326")

                var feature = new OpenLayers.Feature({
                  geometry: new OpenLayers.geom.Point(coords),
                  name: record.Distance
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
