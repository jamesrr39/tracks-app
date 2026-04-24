import { LngLat, StyleSpecification } from "maplibre-gl";
import { HttphandlersCustomMap } from "../../openapi/generated/tracksAppSchemas";
import { MapChoice } from "./Controls";

export const OVERLAY_IMAGE_SOURCE = "overlay-image"
export const OVERLAY_IMAGE_LAYER_NAME = 'overlay';
type SlabProps = {
    opacity: number
}

export function getOSMLayer(slabProps: SlabProps): StyleSpecification {
  return {
    version: 8,
    sources: {
      'osm-tiles': {
        type: 'raster',
        tiles: [
          'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
          'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
          'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png'
        ],
        tileSize: 256,
        attribution: '© OpenStreetMap contributors'
      }
    },
    layers: [
      {
        id: 'osm-layer',
        type: 'raster',
        source: 'osm-tiles',
        minzoom: 0,
        maxzoom: 19,
        paint: {
          'raster-opacity': slabProps.opacity
        }
      }
    ],
  }
}

export function createCustomMapSlab(customMap: HttphandlersCustomMap): StyleSpecification {
    return {
        version: 8,
        sources: {
          [OVERLAY_IMAGE_SOURCE]: {
            type: 'image',
            url: `/map/custom-map/${encodeURIComponent(customMap.name)}`,
            coordinates: [
              [customMap.bounds.minLon, customMap.bounds.maxLat],
              [customMap.bounds.maxLon, customMap.bounds.maxLat],
              [customMap.bounds.maxLon, customMap.bounds.minLat],
              [customMap.bounds.minLon, customMap.bounds.minLat],
            ]
          },
        },
        layers: [
          {
            id: OVERLAY_IMAGE_LAYER_NAME,
            type: 'raster',
            source: OVERLAY_IMAGE_SOURCE,
            paint: {
              'raster-opacity': 0.5
            }
          },
        ],
      } as const
    
    
}

