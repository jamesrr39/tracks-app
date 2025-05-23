import DateRangePicker from "../DateRangePicker";
import Select from 'react-select'

export type Filter = {
    activities: string[]
    devices: string[]
}

type Props = {
    activities: string[]
    devices: string[]
    onChange: (newValue: Filter) => void
    filter: Filter
}

function FilterComponent({activities, devices, onChange, filter}: Props) {
    const activitiesSelectOptions = activities.map(activity => ({value: activity, label: activity}));
    const devicesSelectOptions = devices.map(device => ({value: device, label: device}));
    console.log(activities, activitiesSelectOptions)

    return (
        <div className="row">
            <div className="col-lg-3 col-md-6">
                <div className="form-control">
                    <label>Device</label>
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
                    <label>Date
                    <select>
                        <option>test</option>
                    </select>
                    </label>
                </div>
                <DateRangePicker onChange={value => {
                    console.log('value', value);
                }} />
            </div>
            <div className="col-lg-3 col-md-6">
                <div className="form-control">
                    <label>Distance
                    <select>
                        <option>test</option>
                    </select>
                    </label>
                </div>
            </div>
            <div className="col-lg-3 col-md-6">
                <div className="form-control">
                    <label>Activity</label>
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
