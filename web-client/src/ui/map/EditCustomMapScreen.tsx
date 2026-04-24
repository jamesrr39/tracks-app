import { useState } from "preact/hooks";
import { useGetMaps } from "../../openapi/generated/tracksAppComponents";
import { HttphandlersGetCustomMapsResponse } from "../../openapi/generated/tracksAppSchemas";
import Error from "../Error";
import Loading from "../Loading";
import SideBySideEditCustomMap from "./SideBySideEditCustomMap";
import OverlayedEditCustomMap from "./OverlayedEditCustomMap";

type Props = {
    params: {
        name: string
    }
}


const styles = {
    mapContainer: {
        width: "100%",
        height: "100vh",
    },
    imageContainer: {
        width: '100%',
        height: 'auto'
    },
    sideBySideContainer: {
        width: "100%",
        display: 'flex',
        justifyContent: 'space-between',
        flexDirection: 'row'
    }
}


function extractMapFromList(data: HttphandlersGetCustomMapsResponse | undefined, name: string) {
    const customMap = data?.customMaps.find(listItem => listItem.name === name);
    return customMap;
}

export default function EditCustomMapScreen(props: Props) {

    const [sideBySideMap, setSideBySideMap] = useState(true);

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
            <p>{JSON.stringify(customMap.calculatedMetadata.bounds)}</p>
            <div>
                <h3>Reference Points</h3>
                <ul>
                    {customMap.referencePoints.map((point, index) => (
                        <li key={index}>{`X, Y: ${point.imageCoords.x}, ${point.imageCoords.y} | Lat: ${point.location.lat}, Lon: ${point.location.lon}`}</li>
                    ))}
                </ul>
            </div>
            <div style={sideBySideMap ? styles.sideBySideContainer : {}}>
                <div>
                    <label>
                        <input type="checkbox" checked={sideBySideMap} onChange={(e) => setSideBySideMap(e.currentTarget.checked)} />
                        Show side by side map
                    </label>
                </div>
                {sideBySideMap ? <SideBySideEditCustomMap customMap={customMap} /> : <OverlayedEditCustomMap customMap={customMap} />}
            </div>
        </>
    );
};
