import { Marker } from "maplibre-gl";
import { HttphandlersCustomMap } from "../../openapi/generated/tracksAppSchemas";
import { PROTOMAPS_AVAILABLE_MAP_THEMES } from "./MapThemes";


const OPENFREEMAP_STYLE_URLS = [
  "https://tiles.openfreemap.org/styles/liberty",
  "https://tiles.openfreemap.org/styles/bright",
  "https://tiles.openfreemap.org/styles/positron"
]

const styles = {
    label: {
        textAlign: 'left',
    }
};

type Props = {
    changeMapTheme: (value: string) => void
    routeColor: string
    onRouteColorChange: (value: string) => void,
    maps: MapChoice[]
    showCustomMarkers: boolean
    setShowCustomMarkers: (newState: boolean) => void
}

export type MapChoice = {
    name: string,
    specification: maplibregl.StyleSpecification | string // if string, should be a URL to the style definition
    markers?: maplibregl.LngLat[]
}

function Controls({ changeMapTheme, routeColor, onRouteColorChange, maps, showCustomMarkers, setShowCustomMarkers }: Props) {
    return (
        <div className="row">
            <div className="col-sm-6 row">
                <label className="col-form-label" style={styles.label}>
                    Map style
                    <select
                        name="map theme"
                        className="form-control"
                        onChange={(event) => {
                            const { value } = event.currentTarget;

                            changeMapTheme(value);
                        }}
                    >
                        {maps.map((map, idx) => (
                            <option value={map.name} key={idx}>
                                {map.name}
                            </option>
                        ))}
                    </select>
                </label>
            </div>
            <div className="col-sm-6 row">
                <label className="col-form-label" style={styles.label}>
                    Route color
                    <input
                        type="color"
                        className="form-control"
                        name="route color"
                        value={routeColor}
                        onChange={(event) => {
                            const { value } = event.currentTarget;
                            onRouteColorChange(value);
                        }}
                    />
                </label>
            </div>
            <div>
                <label>
                    <input 
                        type="checkbox" 
                        defaultChecked={showCustomMarkers} 
                        onChange={(event) => setShowCustomMarkers(event.currentTarget.checked)}
                    />
                    Show custom markers
                </label>
            </div>
        </div>
    );
}

export default Controls;
