import maplibregl, { LayerSpecification, LngLat, Marker } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import {
  DomainGeoFileSummary,
  DomainRecord,
} from "../../openapi/generated/tracksAppSchemas";
import { layers, namedFlavor } from '@protomaps/basemaps';
import { ProtomapsMapTheme } from "./MapThemes";
import Controls, { MapChoice } from "./Controls";
import { getPMTilesSource } from "../../context/PMTilesContext";
import { HttphandlersGetCustomMapsResponse } from "../../openapi/generated/tracksAppSchemas";
import { useGetMaps } from "../../openapi/generated/tracksAppComponents";
import { getOSMLayer } from "./mapstyles";
import { useDrawMap } from "./hooks/drawMapHook";
import { createMarkers } from "./trackMarkers";

const OPENFREEMAP_STYLES = [
  { name: 'Liberty', url: "https://tiles.openfreemap.org/styles/liberty" },
  { name: 'Bright', url: "https://tiles.openfreemap.org/styles/bright" },
  { name: 'Positron', url: "https://tiles.openfreemap.org/styles/positron" },
];

const DEFAULT_PROTOMAPS_THEME: ProtomapsMapTheme = "light";

const DEFAULT_ROUTE_COLOR = "#f66151";

const ROUTE_LAYER_SOURCE_ID = "route";

const PMTILES_URL = "/map/pmtiles";

function getProtomapsStyle(selectedTheme: ProtomapsMapTheme): maplibregl.StyleSpecification {
  const pmTilesSource = getPMTilesSource(PMTILES_URL);

  console.log('selectedTheme', selectedTheme)

  return {
    version: 8,
    glyphs: "/map/pmtiles-basemap-assets/fonts/{fontstack}/{range}.pbf",
    sources: {
      [PMTILES_SOURCE_NAME]: {
        type: "vector",
        url: `pmtiles://${pmTilesSource.url}`,
        attribution:
          '© <a href="https://openstreetmap.org">OpenStreetMap</a>',
      },
    },
    // layers: ProtomapLayers(PMTILES_SOURCE_NAME, selectedTheme),
    layers: layers(PMTILES_SOURCE_NAME, namedFlavor(selectedTheme), { lang: "en" })
  }
}

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

const PMTILES_SOURCE_NAME = "chosen_pmtiles_source";

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

const changeMapTheme = (maplibreMap: maplibregl.Map | null, mapThemes: MapChoice[] | undefined, selectedThemeName: string, options?: {onRedrawn: () => void}) => {
  if (!maplibreMap || !mapThemes) {
    return;
  }

  const selectedTheme = mapThemes.find(theme => theme.name === selectedThemeName);
  if (!selectedTheme) {
    throw new Error(`no theme found for selectedThemeName "${selectedThemeName}"`);
  }
  console.log('setting style', selectedTheme)

  maplibreMap.getLayersOrder().forEach(layerName => {
      maplibreMap.removeLayer(layerName);
  })

  maplibreMap.setStyle((selectedTheme.specification));

  // setStyle = asynchronous.
  // For any actions after this, we wait until the map is finished with updates (.once('idle') 
  maplibreMap.once('idle', () => {
    selectedTheme.markers?.forEach(lngLat => {

      const marker = new Marker();

      marker.setLngLat(lngLat).addTo(maplibreMap);
    });
    options?.onRedrawn();
  });
}

const drawRoute = (maplibreMap: maplibregl.Map | null, coordinates: number[][], selectedColor: string) => {
  if (!maplibreMap) {
    console.log('drawRoute: no maplibreMap')
    return;
  }

  console.log('drawRoute: drawing route');
  if (maplibreMap.getLayer(ROUTE_LAYER_SOURCE_ID)) {
    maplibreMap.removeLayer(ROUTE_LAYER_SOURCE_ID);
    maplibreMap.removeSource(ROUTE_LAYER_SOURCE_ID);
  }

  const route = getRoute(coordinates, selectedColor);
  maplibreMap.addSource(ROUTE_LAYER_SOURCE_ID, route.source);
  maplibreMap.addLayer(route.layer);
  console.log('route layer added')
};

// FIXME: terrain? https://docs.protomaps.com/basemaps/downloads#terrain
// attribution: https://github.com/tilezen/joerd/blob/master/docs/attribution.md
// https://docs.protomaps.com/pmtiles/maplibre#raster-or-terrain-pmtiles

function drawCustomMarkers(m: maplibregl.Map, customMarkers: maplibregl.Marker[], showCustomMarkers: boolean) {
  if (showCustomMarkers) {
    customMarkers.forEach(marker => marker.addTo(m))
  } else {
    console.log('removing markers::')
    customMarkers.forEach(marker => marker.remove())
  }
}

function useUpdateCustomMarkers(m: maplibregl.Map | null, customMarkers: maplibregl.Marker[], showCustomMarkers: boolean) {
  useEffect(() => {
    if (!m) {
      return;
    }
    drawCustomMarkers(m, customMarkers, showCustomMarkers);
  });
}

function activityBoundsToLatLng(activityBounds: DomainGeoFileSummary['activityBounds']): maplibregl.LngLatBounds {
  return new maplibregl.LngLatBounds(
    new maplibregl.LngLat(activityBounds.longMin, activityBounds.latMin),
    new maplibregl.LngLat(activityBounds.longMax, activityBounds.latMax),
  )
}

export function MaplibreGLMap({ trackRecords, trackSummary }: Props) {
  const [routeColor, setRouteColor] = useState(DEFAULT_ROUTE_COLOR);
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map>(null);
  const pmTilesSource = getPMTilesSource(PMTILES_URL);

  const [showCustomMarkers, setShowCustomMarkers] = useState(true);

  const customMarkers = useMemo(() => createMarkers(trackSummary, trackRecords), [trackSummary, trackRecords]);

  const coordinates = trackRecords.map((record) => {
    return [record.posLong, record.posLat];
  });

  const { data: mapsResponse, isLoading, error } = useGetMaps({})


  const mapThemes = useMemo(() => createMapChoices(mapsResponse), [mapsResponse])
  
  console.log(
    'MaplibreGLMap', 
    "themes", mapThemes, 
    "mapContainer", mapContainer.current, 
    "map", map.current, 
    "isLoading", isLoading, 
    "error", error, 
    "mapsResponse", mapsResponse
  );

  useDrawMap(
    map, 
    mapContainer, 
    activityBoundsToLatLng(trackSummary.activityBounds),
    {
      opacity: 1,
      onLoad: () => {
        if (!map.current) {
          throw new Error('map onLoad: map.current is null?')
        }
        const m = map.current;
        const route = getRoute(coordinates, routeColor);
        m.addSource(ROUTE_LAYER_SOURCE_ID, route.source);
        m.addLayer(route.layer);
        drawCustomMarkers(m, customMarkers, showCustomMarkers);
      }
    }
  );

  const onNewThemeSelected = (selectedThemeName: string) => {
    if (!map.current) {
      return;
    }
    changeMapTheme(map.current, mapThemes, selectedThemeName, {
      onRedrawn: () => drawRoute(map.current, coordinates, routeColor)
    })
  };

  useUpdateCustomMarkers(map.current, customMarkers, showCustomMarkers);

  if (error) {
    return <p>Error</p>
  }

  if (isLoading) {
    return <p>Loading...</p>
  }

  if (!mapsResponse) {
    return null;
  }

  return (
    <div style={styles.mapWrapper}>
      <Controls
        changeMapTheme={onNewThemeSelected}
        routeColor={routeColor}
        onRouteColorChange={(value: string) => {
          setRouteColor(value)
          drawRoute(map.current, coordinates, value);
        }}
        maps={mapThemes || []}
        showCustomMarkers={showCustomMarkers}
        setShowCustomMarkers={setShowCustomMarkers}
      />

      <div ref={mapContainer} style={styles.map} />
    </div>
  );
}

function createMapChoices(maps: HttphandlersGetCustomMapsResponse | undefined) {
  if (!maps) {
    return;
  }

  const includeDebugLayer = true;

  const osmMap = getOSMLayer({opacity: 0.3});

  let debugSpec = {
    sources: {}, 
    layers: [] as LayerSpecification[]
  };
  if (includeDebugLayer) {
    debugSpec = osmMap;
  }

  const mapChoices: MapChoice[] = []
  mapChoices.push({
    name: "OpenStreetMap raster tiles",
    specification: osmMap,
  })
  maps.pmTiles.forEach(theme => {
    mapChoices.push({
      name: `Protomaps - ${theme.name}`,
      specification: getProtomapsStyle(theme.name)
    });
  });
  OPENFREEMAP_STYLES.map(openFreeMapStyle => {
    mapChoices.push({
      name: `OpenFreeMap - ${openFreeMapStyle.name}`,
      specification: openFreeMapStyle.url,
    })
  })
  maps.customMaps.map(customMap => {
    const {bounds} = customMap.calculatedMetadata;
    mapChoices.push({
      name: `Custom map - ${customMap.name}`,
      specification: {
        version: 8,
        sources: {
          "overlay-image": {
            type: 'image',
            url: `/map/custom-map/${encodeURIComponent(customMap.name)}`,
            coordinates: [
              [bounds.minLon, bounds.maxLat],
              [bounds.maxLon, bounds.maxLat],
              [bounds.maxLon, bounds.minLat],
              [bounds.minLon, bounds.minLat],
            ]
          },
          ...debugSpec.sources
        },
        layers: [
          {
            id: 'overlay',
            type: 'raster',
            source: 'overlay-image',
            paint: {
              'raster-opacity': 1
            }
          },
          ...debugSpec.layers,
        ],
      }, // TODO layer as well?
      markers: customMap.referencePoints.map(point => {
        const { location } = point;

        return new LngLat(location.lon, location.lat);
      })
    });
  });

  return mapChoices;
}
