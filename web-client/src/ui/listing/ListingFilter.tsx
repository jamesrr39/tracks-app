import DateRangePicker, { DateRange } from "../DateRangePicker";
import Select from 'react-select'

export type Filter = {
    activities: string[]
    devices: string[]
    dateRange: DateRange
}

type Props = {
    activities: string[]
    devices: string[]
    dateRange: DateRange
    onChange: (newValue: Filter) => void
    filter: Filter
}

function Label({children}: {children: string}) {
    return <div style={{width: '100%', textAlign: 'left'}}><small>{children}</small></div>
}

function FilterComponent({activities, devices, dateRange, onChange, filter}: Props) {
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
                    <DateRangePicker dateRange={filter.dateRange} onChange={value => {
                        onChange({
                            ...filter,
                            dateRange: value
                        });
                    }} />
                </div>
            </div>
            <div className="col-lg-3 col-md-6">
                <div className="form-control">
                    <Label>Distance</Label>
                    <select>
                        <option>test</option>
                    </select>
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
