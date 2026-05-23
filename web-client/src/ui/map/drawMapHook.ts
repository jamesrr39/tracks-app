import maplibregl from "maplibre-gl";
import { useEffect } from "preact/hooks";

import React from "preact/compat";
import { getOSMLayer } from "./mapstyles";

export function useDrawMap(
    mapRef: React.RefObject<maplibregl.Map>, 
    mapContainer: React.RefObject<HTMLDivElement>, 
    bounds: maplibregl.LngLatBounds, 
    options: {
        opacity: number
        onLoad: () => void
    }
) {
    useEffect(() => {
        if (!mapContainer.current) {
            return;
        }
        console.log('useEffect: initializing map');

        // setBounds(new LngLatBounds(new LngLat(bounds.minLon, bounds.minLat), new LngLat(bounds.maxLon, bounds.maxLat)));
        const centerLat = (bounds.getNorth() + bounds.getSouth()) / 2;
        const centerLon = (bounds.getEast() + bounds.getWest()) / 2;

        const maplibreMap = new maplibregl.Map({
            container: mapContainer.current,
            zoom: 13,
            center: [centerLon, centerLat],
            // style: 'https://tiles.openfreemap.org/styles/liberty',
            style: getOSMLayer({ opacity: options.opacity })

        });
        mapRef.current?.remove();
        mapRef.current = maplibreMap;

        maplibreMap.on("load", () => {
            console.log('map loaded')
            options.onLoad();
            // const slab = createCustomMapSlab(customMap);

            // for (const sourceName in slab.sources) {
            //     const source = (slab.sources)[sourceName];
            //     maplibreMap.addSource(sourceName, source);
            // }
            // slab.layers.forEach(layer => maplibreMap.addLayer(layer));


            // console.log('maplibre: called load')
            // const route = getRoute(coordinates, routeColor);
            // maplibreMap.addSource(ROUTE_LAYER_SOURCE_ID, route.source);
            // maplibreMap.addLayer(route.layer);
        });
    }, [bounds, mapContainer.current, mapRef.current])
}


/*
  useEffect(() => {
    console.log('map', map.current, mapContainer.current)
    if (!mapContainer.current) {
      return;
    }

    // we first fetch the header so we can get the center lon, lat of the map.
    // pmTilesSource.tiles.getHeader().then((pmtilesHeader) => {
    console.log('running create map')

    const { activityBounds: initialBbox } = trackSummary;
    const centerLat = (initialBbox.latMax + initialBbox.latMin) / 2;
    const centerLon = (initialBbox.longMax + initialBbox.longMin) / 2;

    const maplibreMap = new maplibregl.Map({
      container: mapContainer.current,
      zoom: 13,
      center: [centerLon, centerLat],
      style: 'https://tiles.openfreemap.org/styles/liberty',
    });
    map.current?.remove();
    map.current = maplibreMap;

    maplibreMap.on("load", () => {
      console.log('maplibre: called load')
      const route = getRoute(coordinates, routeColor);
      maplibreMap.addSource(ROUTE_LAYER_SOURCE_ID, route.source);
      maplibreMap.addLayer(route.layer);

      const markers = createMarkers(trackSummary, trackRecords);
      markers.forEach(marker => marker.addTo(maplibreMap));
    });

    maplibreMap.on("click", (event) => {
      const { lngLat } = event;
      console.log('click:', lngLat)
      // setCustomMarkers(m => {
      //   return m.concat([{lngLat}]);
      // });
    })
    // });
  }, [map.current, mapContainer.current, mapsResponse]);

*/