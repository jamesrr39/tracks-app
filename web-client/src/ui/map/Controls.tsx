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
    onRouteColorChange: (value: string) => void
}

function Controls({ changeMapTheme, routeColor, onRouteColorChange }: Props) {
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
                        {PROTOMAPS_AVAILABLE_MAP_THEMES.map((theme) => (
                            <option value={theme}>Protomaps: {theme}</option>
                        ))}
                        {OPENFREEMAP_STYLE_URLS.map((theme) => (
                            <option value={theme}>OpenFreeMap: {theme}</option>
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
        </div>
    );
}

export default Controls;
