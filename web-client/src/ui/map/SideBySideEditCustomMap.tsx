import maplibregl, {  } from "maplibre-gl";
import { useEffect, useRef } from "preact/hooks";
import { HttphandlersCustomMap } from "../../openapi/generated/tracksAppSchemas";
import React from "preact/compat";
import { useDrawMap } from "./drawMapHook";

type Props = {
    customMap: HttphandlersCustomMap
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



function useDrawOnCanvas(canvasRef: React.RefObject<HTMLCanvasElement>, imageUrl: string) {
    useEffect(() => {
        console.log('useEffect: drawing on canvas', canvasRef.current)

        if (!canvasRef.current) {
            return;
        }

        const ctx = canvasRef.current.getContext('2d');
        if (!ctx) {
            return;
        }
        // const image = new Image();
        // image.onload = () => {
        //     if (!canvasRef.current) {
        //         return;
        //     }
        //     canvasRef.current.width = image.width;
        //     canvasRef.current.height = image.height;
        //     ctx.drawImage(image, 0, 0);
        // }
        // image.src = `/map/custom-map/${encodeURIComponent(props.params.name)}`;

        ctx.beginPath();
        ctx.arc(400, 400, 20, 0, 2 * Math.PI);
        ctx.fillStyle = "red";
        ctx.fill();
        ctx.lineWidth = 4;
        ctx.strokeStyle = "blue";
        ctx.stroke();
    }, [imageUrl, canvasRef.current]);
}


function SideBySideEditCustomMap({ customMap }: Props) {
    const mapRef = useRef<maplibregl.Map>(null);
    const mapContainer = useRef<HTMLDivElement>(null);

    const canvasRef = useRef<HTMLCanvasElement>(null);

    useDrawOnCanvas(canvasRef, `/map/custom-map/${encodeURIComponent(customMap.name)}`);

    useDrawMap(mapRef, mapContainer, customMap, {opacity: 1})


    return (
        <div style={styles.sideBySideContainer}>
            {/* <img style={styles.imageContainer} src={`/map/custom-map/${encodeURIComponent(customMap.name)}`} /> */}
            <canvas ref={canvasRef} style={{ ...styles.imageContainer, backgroundImage: `url(/map/custom-map/${encodeURIComponent(customMap.name)})` }} />
            <div style={styles.mapContainer} ref={mapContainer} />

        </div>
    )
}

export default SideBySideEditCustomMap;
