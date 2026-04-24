import maplibregl from "maplibre-gl";
import { useEffect } from "preact/hooks";
import { HttphandlersCustomMap } from "../../openapi/generated/tracksAppSchemas";
import { getOSMLayer } from "./mapstyles";

export function useDrawMap(mapRef: React.RefObject<maplibregl.Map>, mapContainer: React.RefObject<HTMLDivElement>, customMap: HttphandlersCustomMap, options: {opacity: number}) {
    useEffect(() => {
        if (!mapContainer.current) {
            return;
        }
        console.log('useEffect: initializing map', customMap)

        const { bounds } = customMap.calculatedMetadata;
        // setBounds(new LngLatBounds(new LngLat(bounds.minLon, bounds.minLat), new LngLat(bounds.maxLon, bounds.maxLat)));
        const centerLat = (bounds.maxLat + bounds.minLat) / 2;
        const centerLon = (bounds.maxLon + bounds.minLon) / 2;

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
    }, [customMap, mapContainer.current, mapRef.current])
}