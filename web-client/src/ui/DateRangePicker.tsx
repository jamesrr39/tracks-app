
export type DateRange = {
    start: Date,
    end: Date
};

type Props = {
    onChange: (value: DateRange) => void
}

function DateRangePicker(props: Props) {
    return (
        <div>
            <div>From <input type="date" /></div>
            <div>To <input type="date" /></div>
        </div>
    )
}

export default DateRangePicker;