

import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import * as pmtiles from "pmtiles";


export function getPMTilesSource(url: string) {
    const protocol = new pmtiles.Protocol();
    maplibregl.addProtocol("pmtiles", protocol.tile);

    // const PMTILES_URL = "/map/pmtiles";
    const pmTilesSource = new pmtiles.PMTiles(url);

    // this is so we share one instance across the JS code and the map renderer
    protocol.add(pmTilesSource);

    return {tiles: pmTilesSource, url};
}

