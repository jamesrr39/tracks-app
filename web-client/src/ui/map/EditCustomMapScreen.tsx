import { useState } from "preact/hooks";
import { useGetMaps } from "../../openapi/generated/tracksAppComponents";
import { HttphandlersCustomMap, HttphandlersGetCustomMapsResponse } from "../../openapi/generated/tracksAppSchemas";
import Error from "../Error";
import Loading from "../Loading";
import SideBySideEditCustomMap from "./SideBySideEditCustomMap";
import OverlayedEditCustomMap from "./OverlayedEditCustomMap";
import TopBottomEditCustomMap from "./TopBottomEditCustomMap";

type Props = {
    params: {
        name: string
    }
}

function extractMapFromList(data: HttphandlersGetCustomMapsResponse | undefined, name: string) {
    const customMap = data?.customMaps.find(listItem => listItem.name === name);
    return customMap;
}

const MapViews = ["sideBySide", "topBottom", "overlayed"];

type MapView = typeof MapViews[number];

export default function EditCustomMapScreen(props: Props) {

    const [mapView, setMapView] = useState<MapView>("sideBySide");

    const { data, isLoading, error } = useGetMaps({});


    if (error) {
        return <Error />
    }

    if (isLoading) {
        return <Loading />
    }

    if (!data) {
        return null;
    }


    const customMap = extractMapFromList(data, props.params.name);
    if (!customMap) {
        return <p>Custom map not found</p>
    }
    console.log('customMap', customMap)
    return (
        <>
            <h2>{customMap.name}</h2>
            <p>{JSON.stringify(customMap.calculatedMetadata, null, "\t")}</p>
            <div>
                <h3>Reference Points</h3>
                <ul>
                    {customMap.referencePoints.map((point, index) => (
                        <li key={index}>{`X, Y: ${point.imageCoords.x}, ${point.imageCoords.y} | Lat: ${point.location.lat}, Lon: ${point.location.lon}`}</li>
                    ))}
                </ul>
            </div>
            <div>
                <div>
                    {MapViews.map(view => (
                        <label key={view} style={{ marginRight: "1em" }}>
                            <input type="radio" name="mapView" value={view} checked={mapView === view} onChange={(e) => setMapView(e.currentTarget.value as MapView)} />
                            {view}
                        </label>
                    ))}
                </div>
                <InnerMap customMap={customMap} mapView={mapView} />
            </div>
        </>
    );
};

function InnerMap({ customMap, mapView }: { customMap: HttphandlersCustomMap, mapView: MapView }) {
    switch (mapView) {
        case "sideBySide":
            return <SideBySideEditCustomMap customMap={customMap} />;
        case "overlayed":
            return <OverlayedEditCustomMap customMap={customMap} />;
        case "topBottom":
            return <TopBottomEditCustomMap customMap={customMap} />;
        default:
            return null;
    }
}
