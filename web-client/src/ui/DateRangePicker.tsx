
// iso format
export type LocalDate = string;

export type DateRange = {
    start: LocalDate,
    end: LocalDate
};

type Props = {
    onChange: (value: DateRange) => void
    dateRange: DateRange
}

function DateRangePicker({onChange, dateRange}: Props) {
    return (
        <div>
            <div>From <input type="date"
                min={dateRange.start}
                max={dateRange.end}
                defaultValue={dateRange.start}
                onChange={event => {
                    onChange({
                        ...dateRange,
                        start: event.currentTarget.value
                    });
                }} />
            </div>
            <div>To <input type="date"
                min={dateRange.start}
                max={dateRange.end}
                defaultValue={dateRange.end}
                onChange={event => {
                    console.log('event', event.currentTarget.value)
                    onChange({
                        ...dateRange,
                        end: event.currentTarget.value
                    });
                }} />
            </div>
        </div>
    )
}

export default DateRangePicker;