import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import * as pmtiles from "pmtiles";
import { useEffect, useRef, useState } from "preact/hooks";
import {
  DomainActivityBounds,
  DomainRecord,
} from "../openapi/generated/tracksAppSchemas";

import ProtomapLayers from "protomaps-themes-base";

const AVAILABLE_MAP_THEMES = ["light", "dark", "white", "grayscale", "black"];

type MapTheme = (typeof AVAILABLE_MAP_THEMES)[number];

const DEFAULT_THEME: MapTheme = "light";

const ROUTE_LAYER_SOURCE_ID = "route";

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

function getRoute(
  coordinates: number[][],
  color: string
): {
  source: maplibregl.SourceSpecification;
  layer: maplibregl.AddLayerObject;
} {
  return {
    source: {
      type: "geojson",
      data: {
        type: "Feature",
        properties: {},
        geometry: {
          type: "LineString",
          coordinates,
        },
      },
    },
    layer: {
      id: "route",
      type: "line",
      source: "route",
      layout: {
        "line-join": "round",
        "line-cap": "round",
      },
      paint: {
        "line-color": color,
        "line-width": 8,
      },
    },
  };
}

const protocol = new pmtiles.Protocol();
maplibregl.addProtocol("pmtiles", protocol.tile);

const PMTILES_URL = "/map/pmtiles";
const PMTILES_SOURCE_NAME = "local_pmtiles_source";
const p = new pmtiles.PMTiles(PMTILES_URL);

// this is so we share one instance across the JS code and the map renderer
protocol.add(p);

export function MaplibreGLMap(props: Props) {
  const [routeColor, setRouteColor] = useState("#999999");
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map>(null);

  const coordinates = props.trackRecords.map((record) => {
    return [record.posLong, record.posLat];
  });

  useEffect(() => {
    if (map.current) {
      return; // stops map from intializing more than once
    }

    if (!mapContainer.current) {
      return;
    }

    // we first fetch the header so we can get the center lon, lat of the map.
    p.getHeader().then((h) => {
      if (!mapContainer.current) {
        return;
      }

      const centerLat =
        (props.initialBbox.latMax + props.initialBbox.latMin) / 2;
      const centerLon =
        (props.initialBbox.longMax + props.initialBbox.longMin) / 2;

      const maplibreMap = new maplibregl.Map({
        container: mapContainer.current,
        zoom: h.maxZoom - 2,
        center: [centerLon, centerLat],
        style: {
          version: 8,
          glyphs: "/map/pmtiles-basemap-assets/fonts/{fontstack}/{range}.pbf",
          sources: {
            [PMTILES_SOURCE_NAME]: {
              type: "vector",
              url: `pmtiles://${PMTILES_URL}`,
              attribution:
                '© <a href="https://openstreetmap.org">OpenStreetMap</a>',
            },
          },
          layers: ProtomapLayers(PMTILES_SOURCE_NAME, DEFAULT_THEME),
        },
      });

      map.current = maplibreMap;

      maplibreMap.on("load", () => {
        const route = getRoute(coordinates, routeColor);
        maplibreMap.addSource(ROUTE_LAYER_SOURCE_ID, route.source);
        maplibreMap.addLayer(route.layer);
      });
    });
  }, []);

  const changeMapTheme = (selectedTheme: string) => {
    const maplibreMap = map.current;
    if (!maplibreMap) {
      return;
    }

    maplibreMap.removeLayer(ROUTE_LAYER_SOURCE_ID);
    maplibreMap.removeSource(ROUTE_LAYER_SOURCE_ID);

    maplibreMap.setStyle({
      version: 8,
      glyphs: "/map/pmtiles-basemap-assets/fonts/{fontstack}/{range}.pbf",
      sources: {
        [PMTILES_SOURCE_NAME]: {
          type: "vector",
          url: `pmtiles://${PMTILES_URL}`,
          attribution:
            '© <a href="https://openstreetmap.org">OpenStreetMap</a>',
        },
      },
      layers: ProtomapLayers(PMTILES_SOURCE_NAME, selectedTheme),
    });

    const route = getRoute(coordinates, routeColor);
    maplibreMap.addSource(ROUTE_LAYER_SOURCE_ID, route.source);
    maplibreMap.addLayer(route.layer);
  };

  const changeRouteColor = (selectedColor: string) => {
    const maplibreMap = map.current;
    if (!maplibreMap) {
      return;
    }

    maplibreMap.removeLayer(ROUTE_LAYER_SOURCE_ID);
    maplibreMap.removeSource(ROUTE_LAYER_SOURCE_ID);

    const route = getRoute(coordinates, selectedColor);
    maplibreMap.addSource(ROUTE_LAYER_SOURCE_ID, route.source);
    maplibreMap.addLayer(route.layer);
  };

  return (
    <div style={styles.mapWrapper}>
      <div>
        <select
          name="map theme"
          onChange={(event) => {
            const { value } = event.currentTarget;

            changeMapTheme(value);
          }}
        >
          {AVAILABLE_MAP_THEMES.map((theme) => (
            <option value={theme}>{theme}</option>
          ))}
        </select>
      </div>
      <div>
        <label>
          Route color
          <input
            type="color"
            name="route color"
            value={routeColor}
            onChange={(event) => {
              const { value } = event.currentTarget;
              setRouteColor(value);
              changeRouteColor(value);
            }}
          />
        </label>
      </div>
      <div ref={mapContainer} style={styles.map} />
    </div>
  );
}
