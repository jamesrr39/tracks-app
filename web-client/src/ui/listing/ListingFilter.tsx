import DateRangePicker, { DateRange } from "../DateRangePicker";
import Select from 'react-select'
import NumericRangeSlider, { NumericRange } from "../range_slider/NumericRangeSlider";

export type Filter = {
    activities: string[]
    devices: string[]
    dateRange: DateRange
    distanceRange: NumericRange
}

type Props = {
    activities: string[]
    devices: string[]
    dateRange: DateRange
    distanceRange: NumericRange
    onChange: (newValue: Filter) => void
    filter: Filter
}

function Label({children}: {children: string}) {
    return <div style={{width: '100%', textAlign: 'left'}}><small>{children}</small></div>
}

function FilterComponent({activities, devices, dateRange, distanceRange, onChange, filter}: Props) {
    const activitiesSelectOptions = activities.map(activity => ({value: activity, label: activity}));
    const devicesSelectOptions = devices.map(device => ({value: device, label: device}));

    return (
        <div className="row">
            <div className="col-lg-3 col-md-6">
                <div className="form-control">
                    <Label>Device</Label>
                    <Select
                        options={devicesSelectOptions}
                        isMulti
                        onChange={(values: {value: string, label: string}[]) => {
                            onChange({
                                ...filter,
                                devices: values.map(value => value.value),
                            });
                        }}
                    />
                </div>
            </div>
            <div className="col-lg-3 col-md-6">
                <div className="form-control">
                    <Label>Date</Label>
                    <DateRangePicker
                        dateRange={dateRange} 
                        onChange={dateRange => {
                            onChange({
                                ...filter,
                                dateRange
                            });
                        }}
                    />
                </div>
            </div>
            <div className="col-lg-3 col-md-6">
                <div className="form-control">
                    <Label>Distance</Label>
                    <NumericRangeSlider
                        min={distanceRange.lowest}
                        max={distanceRange.highest}
                        onChange={(value: NumericRange) => {
                            onChange({
                                ...filter,
                                distanceRange: {
                                    lowest: value.lowest,
                                    highest: value.highest,
                                }
                            })
                        }}
                        labelFormatter={(distanceMetres: number) => {                         
                            return (distanceMetres/1000).toFixed(2) + "km";
                        }}
                    />
                </div>
            </div>
            <div className="col-lg-3 col-md-6">
                <div className="form-control">
                    <Label>Activity</Label>
                    <Select
                        options={activitiesSelectOptions}
                        isMulti
                        onChange={(values: {value: string, label: string}[]) => {
                            onChange({
                                ...filter,
                                activities: values.map(value => value.value),
                            });
                        }}
                    />
                </div>
            </div>
        </div>
    )
}

export default FilterComponent;
