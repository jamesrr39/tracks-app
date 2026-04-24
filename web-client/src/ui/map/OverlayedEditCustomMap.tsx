import maplibregl, {  } from "maplibre-gl";
import { useRef, useState } from "preact/hooks";
import { HttphandlersCustomMap } from "../../openapi/generated/tracksAppSchemas";
import { createCustomMapSlab, OVERLAY_IMAGE_LAYER_NAME, OVERLAY_IMAGE_SOURCE } from "./mapstyles";
import { useDrawMap } from "./drawMapHook";


type Props = {
    customMap: HttphandlersCustomMap
}


const styles = {
    mapContainer: {
        width: "100%",
        height: "100vh",
    }
}

const MOVE_INCREMENT = 0.0001

function OverlayedEditCustomMap({customMap}: Props) {
    const mapRef = useRef<maplibregl.Map>(null);
    const mapContainer = useRef<HTMLDivElement>(null);

    const [bounds, setBounds] = useState<maplibregl.LngLatBounds>(
        new maplibregl.LngLatBounds()
    );

    useDrawMap(mapRef, mapContainer, customMap, {opacity: 1});

    const moveMap = (increment: number) => {
        if (!mapRef.current) {
            return null;
        }
        const mapRefDef = mapRef.current;

        const imgSource = mapRef.current.getSource(OVERLAY_IMAGE_SOURCE);
        if (!imgSource) {
            throw "expected imgSource but got nothing";
        }


        const newBounds = new maplibregl.LngLatBounds(
            new maplibregl.LngLat(bounds.getWest(), bounds.getSouth() + increment),
            new maplibregl.LngLat(bounds.getEast(), bounds.getNorth() + increment)
        )

        mapRefDef.removeLayer(OVERLAY_IMAGE_LAYER_NAME);
        mapRefDef.removeSource(OVERLAY_IMAGE_SOURCE);
        customMap.calculatedMetadata.bounds = {
            maxLat: newBounds.getNorth(),
            minLat: newBounds.getSouth(),
            maxLon: newBounds.getEast(),
            minLon: newBounds.getWest(),
        }
        const newSlabSpec = createCustomMapSlab(customMap);

        const s = newSlabSpec.sources[OVERLAY_IMAGE_SOURCE]
        mapRefDef.addSource(OVERLAY_IMAGE_SOURCE, s)
        newSlabSpec.layers.forEach(layer => mapRefDef.addLayer(layer));

        setBounds(newBounds)
    }

    return (
        <div>
            <form>
                <button type="button" onClick={() => {
                    moveMap(MOVE_INCREMENT);
                }}>Up</button>
                <button type="button" onClick={() => {
                    moveMap(MOVE_INCREMENT * -1);
                }}>Down</button>
            </form>
            <div style={styles.mapContainer} ref={mapContainer} />
        </div>
    )
}

export default OverlayedEditCustomMap;