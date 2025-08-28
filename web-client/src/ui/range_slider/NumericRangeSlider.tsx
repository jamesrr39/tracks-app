import { useState } from "preact/hooks";

// https://www.w3schools.com/howto/howto_js_rangeslider.asp

const sliderClassName = "numeric-range-slider"

const css = `
.${sliderClassName} input[type=range]::-webkit-slider-thumb,
.${sliderClassName} input[type=range]::-ms-thumb, 
.${sliderClassName} input[type=range]::-moz-range-thumb {
    z-index: 10000;
}

.${sliderClassName} input::-moz-range-track {
    position: relative;
    z-index: -1;

    background-color: rgba(0, 0, 0, 1);
    border: 0;
    height: 0;
    display: none;
}

.${sliderClassName} input[type='range']::-moz-range-thumb {
    position: relative;
    height: 15px;
    width: 15px;
    background: #fff;
    border: 1px solid #003D7C;
    border-radius: 25px;
    z-index: 1;
}


.full-range,
.incl-range {
	width: 100%;
	height: 5px;
	left: 0;
	top: 10px;
	position: absolute;
	background: #DDD;
}

.incl-range {
	background: gold;
}

`;

const stylesheet = document.createElement("style");
stylesheet.setAttribute("type", "text/css");
stylesheet.innerHTML = css;

document.head.appendChild(stylesheet);

export type NumericRange = {lowest: number, highest: number}

type Props = {
    max: number
    min: number
    onChange: (range: NumericRange) => void
    labelFormatter?: (value: number) => string
}

const styles = {
    label: {
        border: '1px solid grey',
        borderRadius: '10px',
        padding: '5px'
    },
    input: {
        position: 'absolute',
        left: 0,
        width: '100%',
        outline: 'none',
        opacity: 0.5,
    },
    inputsWrapper: {
        position: 'relative',
        height: '30px'
    }
}

// https://stackoverflow.com/a/44384948
// https://codepen.io/tylerama/pen/YwvpBW
function NumericRangeSlider({min, max, onChange, labelFormatter}: Props) {
    const [marker1, setMarker1] = useState(min);
    const [marker2, setMarker2] = useState(max);

    return (
        <div className={sliderClassName}>
            <section class="range-slider container">
                <span style={styles.label} class="output outputOne">{labelFormatter ? labelFormatter(marker1) : marker1}</span>
                <span style={styles.label} class="output outputTwo">{labelFormatter ? labelFormatter(marker2) : marker2}</span>

                <div style={styles.inputsWrapper}>                
                    <span class="full-range"></span>
                    <span class="incl-range"></span>
                    <input style={styles.input} name="rangeOne" defaultValue={`${min}`} min={min} max={max} step="1" type="range"
                        onChange={event => {
                            const value = parseFloat(event.currentTarget.value);
                            setMarker1(value);
                            const highest = value > marker2 ? value : marker2;
                            const lowest = value <= marker2 ? value : marker2;
                            onChange({highest, lowest})
                        }}
                    />
                    <input style={styles.input} name="rangeTwo" defaultValue={`${max}`} min={min} max={max} step="1" type="range"
                        onChange={event => {
                            const value = parseFloat(event.currentTarget.value);
                            setMarker2(value);
                            const highest = value > marker1 ? value : marker1;
                            const lowest = value <= marker1 ? value : marker1;
                            onChange({highest, lowest})
                        }}
                    />
                </div>
            </section>
        </div>
    );
}

export default NumericRangeSlider;