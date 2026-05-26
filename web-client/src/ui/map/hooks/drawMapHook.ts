import maplibregl from "maplibre-gl";
import { useEffect } from "preact/hooks";
import { getOSMLayer } from "../mapstyles";

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
        if (mapRef.current) {
          // map already initialized
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
        mapRef.current = maplibreMap;

        maplibreMap.on("load", () => {
            console.log('map loaded')
            options.onLoad();
        });
    }, [bounds, mapContainer.current, mapRef.current])
}
