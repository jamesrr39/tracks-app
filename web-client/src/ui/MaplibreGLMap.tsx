import maplibregl, { Marker } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import * as pmtiles from "pmtiles";
import { useEffect, useRef, useState } from "preact/hooks";
import {
  DomainGeoFileSummary,
  DomainRecord,
} from "../openapi/generated/tracksAppSchemas";

import ProtomapLayers from "protomaps-themes-base";
import { formatShortDuration, getDurationSeconds } from "../util/time";
import { binarySearch, BinarySearchResult } from "../util/binary_search";

const AVAILABLE_MAP_THEMES = ["light", "dark", "white", "grayscale", "black"];

type MapTheme = (typeof AVAILABLE_MAP_THEMES)[number];

const DEFAULT_THEME: MapTheme = "light";

const ROUTE_LAYER_SOURCE_ID = "route";

const styles = {
  mapWrapper: {
    display: 'flex',
    flexDirection: 'column',
    height:
      "calc(100vh - 77px)" /* calculate height of the screen minus the heading */,
  },
  map: {
    flexGrow: 1,
  },
};

// https://docs.maptiler.com/react/maplibre-gl-js/how-to-use-maplibre-gl-js/

type Props = {
  trackRecords: DomainRecord[];
  trackSummary: DomainGeoFileSummary;
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

  const { trackRecords, trackSummary } = props;

  const coordinates = trackRecords.map((record) => {
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

      const { activityBounds: initialBbox } = trackSummary;
      const centerLat = (initialBbox.latMax + initialBbox.latMin) / 2;
      const centerLon = (initialBbox.longMax + initialBbox.longMin) / 2;

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

        addMarkers(maplibreMap);
      });
    });
  }, []);

  const changeMapTheme = (selectedTheme: string) => {
    const maplibreMap = map.current;
    if (!maplibreMap) {
      return;
    }

    // maplibreMap.removeLayer(ROUTE_LAYER_SOURCE_ID);
    // maplibreMap.removeSource(ROUTE_LAYER_SOURCE_ID);

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

    // const route = getRoute(coordinates, routeColor);
    // maplibreMap.addSource(ROUTE_LAYER_SOURCE_ID, route.source);
    // maplibreMap.addLayer(route.layer);

    changeRouteColor(routeColor);
  };

  const changeRouteColor = (selectedColor: string) => {
    const maplibreMap = map.current;
    if (!maplibreMap) {
      return;
    }

    if (maplibreMap.getLayer(ROUTE_LAYER_SOURCE_ID)) {
      maplibreMap.removeLayer(ROUTE_LAYER_SOURCE_ID);
      maplibreMap.removeSource(ROUTE_LAYER_SOURCE_ID);
    }

    const route = getRoute(coordinates, selectedColor);
    maplibreMap.addSource(ROUTE_LAYER_SOURCE_ID, route.source);
    maplibreMap.addLayer(route.layer);
  };

  const addMarkers = (maplibreMap: maplibregl.Map) => {
    const totalDistanceMetres = trackRecords[trackRecords.length - 1].distance;

    if (totalDistanceMetres < 1000) {
      return;
    }

    for (
      let targetDistance = 1000;
      targetDistance < totalDistanceMetres;
      targetDistance += 1000
    ) {
      const closestMatchIdx = binarySearch(trackRecords.length, (currIdx) => {
        const currDistance = trackRecords[currIdx].distance;

        if (currDistance === targetDistance) {
          return BinarySearchResult.EXACT_MATCH;
        }

        if (currDistance > targetDistance) {
          return BinarySearchResult.GO_LOWER;
        }

        return BinarySearchResult.GO_HIGHER;
      });

      const closestRecord = trackRecords[closestMatchIdx];
      const { startTime } = trackSummary;
      const durationDisplay = formatShortDuration(
        getDurationSeconds({ startTime, endTime: closestRecord.timestamp })
      );
      const marker = new Marker();
      marker.setLngLat([closestRecord.posLong, closestRecord.posLat]);

      const iconEl = document.createElement("div");
      iconEl.style.marginBottom = "30px";

      const textEl = document.createElement("div");
      textEl.style.backgroundColor = "white";
      textEl.style.opacity = "0.5";
      textEl.style.padding = "5px";
      textEl.style.borderRadius = "8px";
      textEl.innerText = `${targetDistance / 1000}km`;
      textEl.appendChild(document.createElement("br"));
      textEl.append(durationDisplay);

      const svgContainerEl = document.createElement("div");
      svgContainerEl.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-arrow-down" viewBox="0 0 16 16">
      <path fill-rule="evenodd" d="M8 1a.5.5 0 0 1 .5.5v11.793l3.146-3.147a.5.5 0 0 1 .708.708l-4 4a.5.5 0 0 1-.708 0l-4-4a.5.5 0 0 1 .708-.708L7.5 13.293V1.5A.5.5 0 0 1 8 1"/>
    </svg>`;

      iconEl.appendChild(textEl);
      iconEl.appendChild(svgContainerEl);

      const markerEl = marker.getElement();
      markerEl.innerHTML = "";
      markerEl.appendChild(iconEl);

      marker.addTo(maplibreMap);
    }
  };

  return (
    <div style={styles.mapWrapper}>
      <Controls
        changeMapTheme={changeMapTheme}
        routeColor={routeColor}
        onRouteColorChange={(value) => {
          setRouteColor(value)
          changeRouteColor(value);
        }}
      />
      <div ref={mapContainer} style={styles.map} />
    </div>
  );
}

type ControlsProps = {
  changeMapTheme: (value: string) => void
  routeColor: string
  onRouteColorChange: (value: string) => void
}

function Controls({changeMapTheme, routeColor, onRouteColorChange}: ControlsProps) {
  return (
    <div>
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
                onRouteColorChange(value);
              }}
            />
          </label>
        </div>
    </div>
  )
}