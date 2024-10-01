import maplibregl, { LayerSpecification } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import * as pmtiles from "pmtiles";
import { useEffect, useRef } from "preact/hooks";
import {
  DomainActivityBounds,
  DomainRecord,
} from "../openapi/generated/tracksAppSchemas";
import { Layers } from "./Layers";

import ProtomapLayers from "protomaps-themes-base";

const styles = {
  mapWrapper: {
    position: "relative",
    width: "100%",
    height:
      "calc(100vh - 77px)" /* calculate height of the screen minus the heading */,
  },
  map: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },
};

// https://docs.maptiler.com/react/maplibre-gl-js/how-to-use-maplibre-gl-js/

type Props = {
  initialBbox: DomainActivityBounds;
  trackRecords: DomainRecord[];
};

export function MaplibreGLMap(props: Props) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map>(null);
  // const lng = 139.753;
  // const lat = 35.6844;
  // const zoom = 14;
  // const API_KEY = "YOUR_MAPTILER_API_KEY_HERE";

  useEffect(() => {
    if (map.current) {
      return; // stops map from intializing more than once
    }

    if (!mapContainer.current) {
      return;
    }

    // map.current = new maplibregl.Map({
    //   container: mapContainer.current,
    //   style: `https://api.maptiler.com/maps/streets-v2/style.json?key=${API_KEY}`,
    //   center: [lng, lat],
    //   zoom: zoom,
    // });

    const protocol = new pmtiles.Protocol();
    maplibregl.addProtocol("pmtiles", protocol.tile);

    // const PMTILES_URL =
    //   "https://pmtiles.io/protomaps(vector)ODbL_firenze.pmtiles";
    const PMTILES_URL = "/map/pmtiles";
    const PMTILES_SOURCE_NAME = "local_pmtiles_source";
    const p = new pmtiles.PMTiles(PMTILES_URL);

    // this is so we share one instance across the JS code and the map renderer
    protocol.add(p);

    // we first fetch the header so we can get the center lon, lat of the map.
    p.getHeader().then((h) => {
      if (!mapContainer.current) {
        return;
      }

      // const maplibreMap = map.current;
      // if (!maplibreMap) {
      //   return;
      // }

      console.log("hh", h);
      const centerLat =
        (props.initialBbox.latMax + props.initialBbox.latMin) / 2;
      const centerLon =
        (props.initialBbox.longMax + props.initialBbox.longMin) / 2;

      const maplibreMap = new maplibregl.Map({
        container: mapContainer.current,
        zoom: h.maxZoom - 2,
        center: [centerLon, centerLat],
        // style: "https://demotiles.maplibre.org/style.json",
        // style: "/map/styles/maplibregl/maptiler-basic-gl-style/style.json",
        style: {
          version: 8,
          glyphs: "https://cdn.protomaps.com/fonts/pbf/{fontstack}/{range}.pbf",
          sources: {
            [PMTILES_SOURCE_NAME]: {
              type: "vector",
              url: `pmtiles://${PMTILES_URL}`,
              attribution:
                '© <a href="https://openstreetmap.org">OpenStreetMap</a>',
            },
          },
          layers: ProtomapLayers(PMTILES_SOURCE_NAME, "light"),

          // layers: [
          //   {
          //     id: "water",
          //     source: PMTILES_SOURCE_NAME,
          //     "source-layer": "water",
          //     filter: ["==", ["geometry-type"], "Polygon"],
          //     type: "fill",
          //     paint: {
          //       "fill-color": "#80b1d3",
          //     },
          //   },
          //   {
          //     id: "buildings",
          //     source: PMTILES_SOURCE_NAME,
          //     "source-layer": "buildings",
          //     type: "fill",
          //     paint: {
          //       "fill-color": "#d9d9d9",
          //     },
          //   },
          //   {
          //     id: "roads",
          //     source: PMTILES_SOURCE_NAME,
          //     "source-layer": "roads",
          //     type: "line",
          //     paint: {
          //       "line-color": "#fc8d62",
          //     },
          //     minzoom: 15,
          //   },
          //   {
          //     id: "pois",
          //     source: PMTILES_SOURCE_NAME,
          //     "source-layer": "pois",
          //     type: "circle",
          //     paint: {
          //       "circle-color": "#ffffb3",
          //     },
          //   },
          // ],

          // layers: [
          //   {
          //     id: "buildings",
          //     source: PMTILES_SOURCE_NAME,
          //     "source-layer": "landuse",
          //     type: "fill",
          //     paint: {
          //       "fill-color": "limegreen",
          //     },
          //   },
          //   {
          //     id: "roads",
          //     source: PMTILES_SOURCE_NAME,
          //     "source-layer": "roads",
          //     type: "line",
          //     paint: {
          //       "line-color": "black",
          //     },
          //   },
          //   // {
          //   //   id: "mask",
          //   //   source: PMTILES_SOURCE_NAME,
          //   //   "source-layer": "mask",
          //   //   type: "fill",
          //   //   paint: {
          //   //     "fill-color": "white",
          //   //   },
          //   // },
          // ],

          // layers: Layers as unknown as LayerSpecification[],
          // layers: [
          //   {
          //     id: "water",
          //     source: "local_pmtiles_source",
          //     "source-layer": "water",
          //     type: "fill",
          //     paint: {
          //       "fill-color": "#80b1d3",
          //     },
          //   },
          //   {
          //     id: "buildings",
          //     source: "local_pmtiles_source",
          //     "source-layer": "buildings",
          //     type: "fill",
          //     paint: {
          //       "fill-color": "#d9d9d9",
          //     },
          //   },
          //   {
          //     id: "roads",
          //     source: "local_pmtiles_source",
          //     "source-layer": "roads",
          //     type: "line",
          //     paint: {
          //       "line-color": "#fc8d62",
          //     },
          //   },
          //   {
          //     id: "pois",
          //     source: "local_pmtiles_source",
          //     "source-layer": "pois",
          //     type: "circle",
          //     paint: {
          //       "circle-color": "#ffffb3",
          //     },
          //   },
          // ],
        },
      });

      map.current = maplibreMap;

      const coordinates = props.trackRecords.map((record) => {
        return [record.posLong, record.posLat];
      });

      maplibreMap.on("load", () => {
        maplibreMap.addSource("route", {
          type: "geojson",
          data: {
            type: "Feature",
            properties: {},
            geometry: {
              type: "LineString",
              coordinates,
            },
          },
        });
        maplibreMap.addLayer({
          id: "route",
          type: "line",
          source: "route",
          layout: {
            "line-join": "round",
            "line-cap": "round",
          },
          paint: {
            "line-color": "#888",
            "line-width": 8,
          },
        });
      });
    });

    // return () => {
    //   mapContainer.current && (mapContainer.current.innerHTML = "");
    // };
  }, []);

  return (
    <div style={styles.mapWrapper}>
      <div ref={mapContainer} style={styles.map} />
    </div>
  );
}
