import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7/+esm';

// const scale_d3 = {'ordinal': d3.scaleOrdinal}
// import * as d3 from 'd3';

function parseD3ColorScheme(input) {
	const regex = /^([a-zA-Z0-9]+)(?:\[(\d+)\])?$/;
	const match = input.match(regex);

	if (!match) return null;

	const rawName = match[1];
	const index = match[2] ? parseInt(match[2], 10) : null;

	const getCorrectD3Name = (inputName) => {
		const d3Keys = Object.keys(d3);
		const lowerInput = inputName.toLowerCase();
		const found = d3Keys.find(key => {
			if (key.startsWith("scheme") || key.startsWith("interpolate")) {
				const cleanKey = key.replace(/^scheme|^interpolate/, '').toLowerCase();
				return cleanKey === lowerInput;
			}
			return false;
		});
		if (found) {
			return found.replace(/^scheme|^interpolate/, '');
		}
		return inputName; // fallback if can't find
	};

	const correctedName = getCorrectD3Name(rawName);
	const fullInterpolate = `interpolate${correctedName}`;
	const fullScheme = `scheme${correctedName}`;

	// Check index, use d3.scheme with index (Ex: d3.schemeReds[5])
	if (index !== null && fullScheme in d3) {
		const scheme = d3[fullScheme];
		if (Array.isArray(scheme)) {
			// Check scheme[index] is exist
			const schemeWithIndex = scheme[index];
			if (Array.isArray(schemeWithIndex)) {
				return {
					type: "scheme",
					value: schemeWithIndex,
					raw: rawName,
				};
			}
		} else if (typeof scheme === "object") {
			return {
				type: "scheme",
				value: scheme[index] || null,
				raw: rawName,
			};
		}
	}

	// If index is not exist, use interpolate (Ex: d3.interpolateReds)
	if (fullInterpolate in d3 && typeof d3[fullInterpolate] === "function") {
		return {
			type: "interpolate",
			value: d3[fullInterpolate],
			raw: rawName,
		};
	}

	// If it's not interpolate but a scheme attached to an index (Ex: d3.schemeCategory10)
	if (fullScheme in d3) {
		const scheme = d3[fullScheme];
		if (Array.isArray(scheme)) {
			return {
				type: "scheme",
				value: scheme,
				raw: rawName,
			};
		}
	}
	console.warn(`D3 doesn't have ${fullScheme} or ${fullInterpolate}`);
	return null;
}
function createColorScale({ domain, range, dataKeys, fallbackInterpolator = d3.interpolateTurbo, label = "Color" }) {
	const isDomainArray = Array.isArray(domain) && domain.length > 0;

	if (isDomainArray) {
		const duplicates = domain.filter((item, index) => domain.indexOf(item) !== index);
		if (duplicates.length > 0) {
			console.warn(`[${label} Warning] Duplicate domain values: ${[...new Set(duplicates)].join(', ')}`);
		}
	}

	let finalDomain;
	if (isDomainArray) {
		const validDomain = domain.filter(d => dataKeys.includes(d));
		const extraDomain = domain.filter(d => !dataKeys.includes(d));
		const missingDomain = dataKeys.filter(d => !validDomain.includes(d));
		if (extraDomain.length > 0) {
			console.warn(`[${label} Warning] Extra domain values not in data: ${extraDomain.join(', ')}`);
		}
		if (missingDomain.length > 0) {
			console.warn(`[${label} Warning] Missing domain values from data: ${missingDomain.join(', ')}`);
		}
		missingDomain.sort((a, b) => a.localeCompare(b));
		finalDomain = [...validDomain, ...missingDomain];
	} else {
		console.warn(`[${label} Warning] Invalid or empty domain. Using dataset values.`);
		finalDomain = [...dataKeys].sort((a, b) => a.localeCompare(b));
	}

	let finalRange = range;
	if (typeof range === 'string') {
		const parsed = parseD3ColorScheme(range);
		if (parsed?.type === "interpolate") {
			finalRange = d3.quantize(parsed.value, finalDomain.length);
		} else if (parsed?.type === "scheme") {
			finalRange = parsed.value;
		}
	}

	if (!Array.isArray(finalRange) || finalRange.length === 0) {
		console.warn(`[${label} Warning] Invalid color range. Using default interpolator.`);
		finalRange = d3.quantize(t => fallbackInterpolator(t), finalDomain.length);
	}

	if (finalRange.length < finalDomain.length) {
		console.warn(`[${label} Warning] Color range (${finalRange.length}) < domain (${finalDomain.length}). Colors will repeat.`);
	} else if (finalRange.length > finalDomain.length) {
		console.warn(`[${label} Warning] Color range (${finalRange.length}) > domain (${finalDomain.length}). Extra colors ignored.`);
	}

	const finalColors = finalDomain.map((_, i) => finalRange[i % finalRange.length]);

	return {
		scale: d3.scaleOrdinal().domain(finalDomain).range(finalColors),
		domain: finalDomain,
		range: finalRange
	};
}

function getAllIndexes(array, value) {
	const indexes = [];
	let i = -1;
	while ((i = array.indexOf(value, i + 1)) !== -1) {
		indexes.push(i);
	}
	return indexes;
}

function dataParser(newValue) {
	try {
		const parsed = JSON.parse(newValue);

		const normalize = (arr) => arr.map(d => {
			const flat = {};
			for (const [k, v] of Object.entries(d)) {
				flat[k] = v?.value !== undefined
					? (isNaN(+v.value) ? v.value : +v.value)
					: v;
			}
			return flat;
		});

		if (Array.isArray(parsed)) {
			return normalize(parsed);
		}

		if (parsed.values && Array.isArray(parsed.values)) {
			return normalize(parsed.values);
		}

		if (typeof parsed === 'object') {
			return normalize([parsed]);
		}

		console.warn("Unrecognized data format", parsed);
		return [];
	} catch (e) {
		console.error("Invalid data attribute", e);
		return null;
	}
}


function encodingParser(newValue) {
	const parsed = JSON.parse(newValue);

		const flatten = (obj) => {
			const result = {};
			for (const [key, val] of Object.entries(obj)) {
				if (val && typeof val === 'object') {
					result[key] = {};
					for (const [k, v] of Object.entries(val)) {
						result[key][k] = v?.value !== undefined
							? (isNaN(+v.value) ? v.value : +v.value)
							: v;
					}
				} else {
					result[key] = val;
				}
			}
			return result;
		};

		return flatten(parsed);
}

// import * as d3 from 'd3';

class BarChart extends HTMLElement {
	#dataValue = '';
	#data = null;
	width = null;
	height = null;
	#width = null;
	#height = null;
	#svgWidth = null;
	#svgHeight = null;
	#legendWidth = null;
	#legendHeight = null;
	#description = '';
	#descriptionWidth = null;
	#descriptionHeight = null;
	#encoding = null;
	legend = null;
	#svg = null;
	#defaultColor = "#cccccc";

	constructor() {
	  super();
	  this.data = null;
	  this.margin = { top: 20, right: 40, bottom: 70, left: 38 };
	  this.attachShadow({ mode: 'open' });
	}

	static get observedAttributes() {
		return ['data', 'width', 'height', 'description', 'encoding', 'legend'];
	}

	connectedCallback() {
	  this.render();
	}

	attributeChangedCallback(name, oldValue, newValue) {
	if (newValue == null) return;

		try {
			switch (name) {
				case 'width':
					this.width = parseInt(newValue);
					this.#width = parseInt(newValue);
					break;
				case 'height':
					this.height = parseInt(newValue);
					this.#height = parseInt(newValue);
					break;
				case 'description':
					this.#description = newValue;
					this.removeAttribute(name);
					break;
				case 'data':
					this.#data = dataParser(newValue);
					this.removeAttribute(name);
					break;
				case 'encoding':
					this.#encoding = encodingParser(newValue);
					this.removeAttribute(name);
					// this.#encoding = JSON.parse(newValue);
					break;
				case 'legend':
					this.legend = newValue === "true";
					this.removeAttribute(name);
					break;
			}
		} catch (e) {
			console.error(`Invalid value for ${name}`, e);
		}

		// Render when data & encoding is ready
		if (this.#data && this.#encoding) {
			this.drawChart();
		}
	}

	render() {
		this.shadowRoot.innerHTML = `
		<style>
			// :host { display: block; width: 100%; height: 100%; position: relative; }
			.main-container {
				display: flex;
				flex-direction: row;
				align-items: center;
				width: ${this.width}px;
				height: ${this.height}px;
			}

			.content {
				display: flex;
				flex-direction: row;
				align-items: center;
				justify-content: center;
				gap: 20px;
				width: 100%;
			}

			.chart-container {
				display: flex;
				flex-direction: column;
				align-items: center;
			}

			.legend-container {
				display: flex;
				flex-direction: column;
				flex-wrap: wrap;
				justify-content: center;
				max-height: 100%;
			}

			.legend-title {
				font-weight: bold;
				text-align: center;
				color: black;
			}

			.color-item {
				display: flex;
				align-items: center;
				gap: 10px;
			}

			.color-item label {
				font-weight: bold;
				text-align: left;
			}

			.color-item input[type="color"] {
				border: none;
				outline: none;
				appearance: none;
				-webkit-appearance: none;
				-moz-appearance: none;
				padding: 0;
				background: transparent;
			}
			.tooltip {
				position: absolute;
				opacity: 0;
				background: white;
				border: solid 1px black;
				border-radius: 5px;
				padding: 5px;
				font-size: 14px;
				pointer-events: auto;
				transition: opacity 0.2s;
				z-index: 9999;
			}
		  	.description {
				text-align: center;
				font-size: 22px;
				font-weight: bold;
				margin-top: 20px;
				display: block;
			}
		</style>
		<div class="main-container">
			<div class="content">
				<div class="legend-container">
					<div class="legend-title"></div>
				</div>

				<div class="chart-container">
					<svg></svg>
					<div class="description"></div>
				</div>
				<div class="tooltip"></div>
				<div class="info-popup"></div>
			</div>
		</div>
	  `;
	}

	// Function to draw Axes based on provided data
	drawAxis(data, xVariable, yVariable, isHorizontal=false, isStacked=false, isNormalized = false, xAxisLabelAngle = 0, yAxisLabelAngle = 0, scaleType, maxLabelLength=5) 
	{
		// Define scales based on direction
		let x, y;
		// Default y-scale
		let yScaleType = scaleType?.type || "linear";
		let exponent = scaleType?.exponent || 1;
		
		if (isHorizontal) {
			if (yScaleType === "log") {
				const rawMax = d3.max(data, d => +d[yVariable]);
				const logMax = Math.pow(10, Math.ceil(Math.log10(rawMax)));
				x = d3.scaleLog()
					.base(10)
					.domain([1, logMax * 10])
					.range([this.margin.left, this.svgWidth - this.margin.right]);
			} else if (yScaleType === "pow") {
				x = d3.scalePow()
					.exponent(exponent)
					.domain([0, d3.max(data, d => +d[yVariable]) * 1.2])
					.range([this.margin.left, this.svgWidth - this.margin.right]);
			} else {
				x = d3.scaleLinear()
					.domain([0, d3.max(data, d => +d[yVariable]) * 1.2])
					.nice()
					.range([this.margin.left, this.svgWidth - this.margin.right]);
			}
			y = d3.scaleBand()
				.domain(data.map(d => d[xVariable]))
				.range([this.margin.top, this.svgHeight - this.margin.bottom])
				.padding(0.1);
		} else {
			x = d3.scaleBand()
				.domain(data.map(d => d[xVariable]))
				.range([this.margin.left, this.svgWidth - this.margin.right])
				.padding(0.3);
		
			if (yScaleType === "log") {
				const rawMax = d3.max(data, d => +d[yVariable]);
				const logMax = Math.pow(10, Math.ceil(Math.log10(rawMax)));
				y = d3.scaleLog()
					.base(10)
					.domain([1, logMax * 10])
					.range([this.svgHeight - this.margin.bottom, this.margin.top]);
			} else if (yScaleType === "pow") {
				y = d3.scalePow()
					.exponent(exponent)
					.domain([0, d3.max(data, d => +d[yVariable]) * 1.2])
					.range([this.svgHeight - this.margin.bottom, this.margin.top]);
			} else {
				y = d3.scaleLinear()
					.domain([0, d3.max(data, d => +d[yVariable]) * 1.2])
					.nice()
					.range([this.svgHeight - this.margin.bottom, this.margin.top]);
			}
		}
		
		if (isStacked) {
			let result = [];
			data.reduce((res, value) => {
				if (!res[value[xVariable]]) {
					res[value[xVariable]] = { x: value[xVariable], y: 0 };
					result.push(res[value[xVariable]]);
				}
				res[value[xVariable]].y += value[yVariable] ? parseInt(value[yVariable]) : 0;
				return res;
			}, {});
	
			let maxY = d3.max(result, d => d.y);
			if (isNormalized) {
				// Normalize total y to 1
				result.forEach(d => { d.y = d.y / d3.max(result, d => d.y); });
				maxY = 1;
			}
			if (isHorizontal) {
				if (yScaleType === "log") {
					x = d3.scaleLog()
						.base(10)
						.domain([1, maxY])
						.range([this.margin.left, this.svgWidth - this.margin.right]);
				} else if (yScaleType === "pow") {
					x = d3.scalePow()
						.exponent(exponent)
						.domain([0, maxY])
						.range([this.margin.left, this.svgWidth - this.margin.right]);
				} else {
					x = d3.scaleLinear()
						.domain([0, maxY])
						.range([this.margin.left, this.svgWidth - this.margin.right]);
				}
				y = d3.scaleBand()
					.domain(result.map(d => d.x))
					.range([this.margin.top, this.svgHeight - this.margin.bottom])
					.padding(0.1);
			} else {
				if (yScaleType === "log") {
					y = d3.scaleLog()
						.base(10)
						.domain([1, maxY])
						.range([this.svgHeight - this.margin.bottom, this.margin.top]);
				} else if (yScaleType === "pow") {
					y = d3.scalePow()
						.exponent(exponent)
						.domain([0, maxY])
						.range([this.svgHeight - this.margin.bottom, this.margin.top]);
				} else {
					y = d3.scaleLinear()
						.domain([0, maxY])
						.range([this.svgHeight - this.margin.bottom, this.margin.top]);
				}
			}
			
		}

		// X Axis
		const xAxis = isHorizontal
		? d3.axisBottom(x)
			.ticks(6)
			.tickFormat(d =>
				isNormalized
				? `${Math.round(d * 100)}%`
				: d < 1000000
					? d
					: d / 1000000 + " M"
			)
		: d3.axisBottom(x)
			.tickFormat(d =>
				typeof d === 'string' && d.length > maxLabelLength
				? d.slice(0, maxLabelLength) + "..."
				: d
			);

		this.svg.append("g")
			.attr("transform", `translate(0, ${this.svgHeight - this.margin.bottom})`)
			.call(xAxis)
			.selectAll("text")
			.style("font-size", this.svgWidth * 0.025 + 'px')
			.attr("transform", `rotate(${xAxisLabelAngle})`)
			.style("text-anchor", xAxisLabelAngle !== 0 ? "start" : "middle");

		// Y Axis
		const yAxis = isHorizontal
		? d3.axisLeft(y)
			.tickFormat(d =>
				typeof d === 'string' && d.length > maxLabelLength
				? d.slice(0, maxLabelLength) + "..."
				: d
			)
		: d3.axisLeft(y)
			.ticks(6)
			.tickFormat(d =>
				isNormalized
				? `${Math.round(d * 100)}%`
				: d < 1000000
					? d
					: d / 1000000 + " M"
			);
			
		this.svg.append("g")
			.attr("transform", `translate(${this.margin.left}, 0)`)
			.call(yAxis)
			.selectAll("text")
			.style("font-size", this.svgHeight * 0.025 + 'px')
			.attr("transform", `translate(-15,5) rotate(${yAxisLabelAngle})`)
			.style("text-anchor", "middle");

		// X axis label
		this.svg.append("text")
			.attr("class", "x-axis-label")
			.attr("x", (this.svgWidth- this.margin.right) / 2)
			.attr("y", this.svgHeight - this.margin.bottom / 2.5)
			.style("text-anchor", "middle")
			.style("font-size", this.svgWidth * 0.05 + 'px')
			.text(isHorizontal ? yVariable : xVariable);

		// Y axis label
		const yAxisTitle = isHorizontal
		? xVariable
		: (yScaleType === "log"
			? `${yVariable} (log)`
			: (yScaleType === "pow"
				? `${yVariable} ^ ${exponent}`
				: yVariable));

		this.svg.append("text")
			.attr("class", "y-axis-label")
			.attr("x", -(this.svgHeight - this.margin.top - this.margin.bottom) / 2)
			.attr("y", -this.margin.left + 20)
			.style("text-anchor", "middle")
			.style("font-size", this.svgHeight * 0.05 + 'px')
			.text(yAxisTitle)
			.attr("transform", "rotate(-90)");

		return [x, y];
	}

	// Draw chart
	drawChart() {
		const tooltip = this.shadowRoot.querySelector(".tooltip");
		// let data = coreData.data[0].values;
		let data = this.#data;
		const svgElement = this.shadowRoot.querySelector('svg');
		d3.select(svgElement).selectAll("g").remove();
		this.svg = d3.select(svgElement)
			.attr("width", this.svgWidth).attr("height", this.svgHeight)
			// .style("margin", "30px")
			.append("g")
			.attr("transform",
				 "translate(" + this.margin.left + "," + this.margin.top + ")");
		const isHorizontal = this.#encoding.direction === "horizontal";
		const stackOption = this.#encoding.stack;
		const isNormalized = stackOption === "normalize";
		const isStacked = stackOption === true || isNormalized;
		const isGrouped = stackOption === false;
		
		const scaleType = this.#encoding.y?.scale; // Scale Type
		const xAxisLabelAngle = this.#encoding.x?.axis?.labelAngle || 0;
		const yAxisLabelAngle = this.#encoding.y?.axis?.labelAngle || 0;
	
		const xVariable = this.#encoding.x?.field || null;
		const yVariable = this.#encoding.y?.field || null;
		
		
		this.svgHeight = this.height * 0.8;
		this.descriptionHeight = this.height * 0.2;
		this.legendHeight = this.height * 0.9;
		
		

		const legendDescription = this.shadowRoot.querySelector(".legend-title");
		legendDescription.style.fontSize = this.legendHeight * 0.04 + 'px';
		legendDescription.style.marginBottom = this.legendHeight * 0.03 + 'px';

		if (legendDescription) {
			legendDescription.textContent = this.#encoding.color?.title || "";
		} else {
			console.warn("legendDescription is null");
		}
		
		// Get the field name used to map colors from the Vega-Lite encoding
		const colorVariable = this.#encoding.color?.field || this.#defaultColor;
		// Check if the dataset has any values for the color field
		const hasColors = data.some(d => d[colorVariable]);

		// Extract values ​​in colorVariable field from data
		let colorField = hasColors ? [...new Set(data.map(d => d[colorVariable]))] : [];
		
		// Get the color scale definition from the encoding
		let colorScaleObj = this.#encoding.color?.scale || null;

		// Retrieve domain and range from the color scale config
		let colorDomain = Array.isArray(colorScaleObj?.domain) ? colorScaleObj.domain : [];
		let rawColorRange = colorScaleObj?.range;

		let colorRange;

		if (this.legend && hasColors) {
			// Set the width for visualization when legend is displayed
			this.svgWidth = this.width * 0.9;
			this.legendWidth = this.width * 0.3;
			this.descriptionWidth = this.width * 0.9;
		} else {
			this.svgWidth = this.width;
			this.legendWidth = 0;
			this.descriptionWidth = this.width;
		}

		// xVariable or yVariable is missing
		if (!xVariable || !yVariable) {
			this.shadowRoot.querySelector(".description").textContent = "Invalid configuration. Please check the console.";
			console.error(`Enter required x or y in the configuration.`);
			// Remove old chart
			// d3.select(svgElement).selectAll("g").remove();

			// Render legend if hasColors
			if (hasColors && colorField.length > 0) {
				this.colorScale = this.createColorScale({
					domain: colorDomain,
					range: rawColorRange,
					dataKeys: colorField,
					fallbackInterpolator: t => d3.interpolateTurbo(t * 0.8 + 0.1),
					label: "Color(Missing x or y axis)"
				});

				this.renderLegend(this.finalColorDomain);
				this.shadowRoot.querySelector(".legend-container").style.display = "flex";
			}
			return;
		}

		const { scale, domain } = createColorScale({
			domain: colorDomain,
			range: rawColorRange,
			dataKeys: colorField,
			fallbackInterpolator: t => d3.interpolateTurbo(t * 0.8 + 0.1),
			label: "Color"
		});
		this.colorScale = scale;
		this.finalColorDomain = domain;

		if (isStacked) {
			data = this.fillMissingStackData(data, xVariable, yVariable);
		}

		if (isStacked && !this.#encoding.color?.field){
			this.shadowRoot.querySelector(".description").textContent = "Invalid configuration. Please check the console.";
			console.error(`[Stacked Error] Missing color field in the configuration for stacked chart.`);
			return;
		}
	
		const [x, y] = this.drawAxis(data, xVariable, yVariable, isHorizontal, isStacked, isNormalized, xAxisLabelAngle, yAxisLabelAngle, scaleType);
		
		if (isStacked && isNormalized) {
			this.drawNormalizedStackedChart(data, x, y, xVariable, yVariable, isHorizontal, tooltip);
		} else if (isStacked) {
			this.drawStackedChart(data, x, y, xVariable, yVariable, isHorizontal, tooltip);
		} else if (isGrouped) {
			this.drawGroupedChart(data, x, y, xVariable, yVariable, colorVariable, colorRange, isHorizontal, hasColors, tooltip);
		} else {
			this.drawRegularChart(data, x, y, xVariable, yVariable, isHorizontal, colorVariable, hasColors, tooltip);
		}
	
		// Color picker & legend
		if (this.legend && hasColors && !isStacked) {
			this.renderLegend(this.finalColorDomain);
			this.shadowRoot.querySelector(".legend-container").style.display = "flex";
		} else if (this.legend && isStacked) {
			this.shadowRoot.querySelector(".legend-container").style.display = "flex";
		} else {
			this.shadowRoot.querySelector(".legend-container").style.display = "none";
		}
		this.shadowRoot.querySelector(".description").textContent = this.#description;
		const descriptionElement = this.shadowRoot.querySelector(".description");
		if (descriptionElement) {
			descriptionElement.style.fontSize = `${this.descriptionWidth * 0.05}px`;
			descriptionElement.style.width = `${this.descriptionWidth}px`;
			descriptionElement.style.height = `${this.descriptionHeight}px`;
		}	}

	fillMissingStackData(data, xVariable, yVariable) {
		const stackVariable = this.#encoding.color?.field || null;
		const stackCategories = [...new Set(data.map(d => d[stackVariable]))];
		const xCategories = [...new Set(data.map(d => d[xVariable]))];
	
		const completeData = [];
	
		xCategories.forEach(xVal => {
			stackCategories.forEach(stackVal => {
				const existing = data.find(d => d[xVariable] === xVal && d[stackVariable] === stackVal);
				if (existing) {
					completeData.push(existing);
				} else {
					const newItem = {
						[xVariable]: xVal,
						[stackVariable]: stackVal,
						[yVariable]: 0
					};
					completeData.push(newItem);
				}
			});
		});
	
		return completeData;
	}
	
	drawStackedChart(data, x, y, xVariable, yVariable, isHorizontal, tooltip, isNormalized = false) {
		const stackVariable = this.#encoding.color?.field || null;
		if (stackVariable){
			const stackKeys = [...new Set(data.map(d => d[stackVariable]))];
			const colorScaleObj = this.#encoding.color?.scale;
			const stackDomain = Array.isArray(colorScaleObj?.domain) ? colorScaleObj.domain : [];
			const rawStackRange = this.#encoding.color?.scale?.range;
			
			const { scale, domain } = createColorScale({
				domain: stackDomain,
				range: rawStackRange,
				dataKeys: stackKeys,
				fallbackInterpolator: t => d3.interpolateTurbo(t * 0.8 + 0.1),
				label: "Stacked"
			});
			this.stackColorScale = scale;
			this.finalColorDomain = domain;
		
			this.renderStackLegend(this.finalColorDomain, this.stackColorScale);
		
			const stackedData = this.getStackedData(data, xVariable, yVariable, stackVariable, stackKeys, isNormalized);
			this.renderStackedBars(stackedData, x, y, isHorizontal, xVariable, yVariable, stackVariable, tooltip);
		} 
	}

	drawNormalizedStackedChart(data, x, y, xVariable, yVariable, isHorizontal, tooltip) {
		this.drawStackedChart(data, x, y, xVariable, yVariable, isHorizontal, tooltip, true);
	}

	drawGroupedChart(data, x, y, xVariable, yVariable, colorVariable, colorRange, isHorizontal, hasColors, tooltip) {
		const groupVariable = this.#encoding.color?.field;
		const groups = [...new Set(data.map(d => d[xVariable]))];
	
		// Create scale for main group
		const x0 = isHorizontal ? null : d3.scaleBand()
			.domain(groups)
			.range([this.margin.left, this.svgWidth - this.margin.right])
			.paddingOuter(0.2).padding(0.3);
	
		const y0 = isHorizontal ? d3.scaleBand()
			.domain(groups)
			.range([this.margin.top, this.svgHeight - this.margin.bottom])
			.paddingOuter(0.2).padding(0.3) : null;
		
	
		const groupedData = d3.groups(data, d => d[xVariable]);
		
		const fixedSubgroupWidth = (isHorizontal ? y0.bandwidth() : x0.bandwidth()) / d3.max(groupedData.map((e) => e[1].length)) * 1.2;
	
		const group = this.svg.append("g")
			.selectAll("g")
			.data(groupedData)
			.join("g")
			.attr("transform", ([group]) =>
				isHorizontal
					? `translate(0, ${y0(group)})`
					: `translate(${x0(group)}, 0)`
			);
	
		group.each(([, values], i, nodes) => {
			const g = d3.select(nodes[i]);
	
			// Get the list of subgroups that exist in the current group
			const localSubgroups = [...new Set(values.map(d => d[groupVariable]))];
	
			// Calculate total width of subgroups
			const totalSubgroupWidth = localSubgroups.length * fixedSubgroupWidth;
	
			// Calculate space to center
			const offset = (isHorizontal ? y0.bandwidth() : x0.bandwidth()) / 2 - totalSubgroupWidth / 2;
	
			g.selectAll("rect")
				.data(values)
				.join("rect")
				.attr("x", d => isHorizontal
					? x(0)
					: offset + localSubgroups.indexOf(d[groupVariable]) * fixedSubgroupWidth
				)
				.attr("y", d => isHorizontal
					? offset + localSubgroups.indexOf(d[groupVariable]) * fixedSubgroupWidth
					: y(d[yVariable])
				)
				.attr("width", d => isHorizontal
					? x(d[yVariable]) - x(0)
					: fixedSubgroupWidth
				)
				.attr("height", d => isHorizontal
					? fixedSubgroupWidth
					: y(0) - y(d[yVariable])
				)
				.attr("fill", d => hasColors ? this.colorScale(d[colorVariable]) : colorVariable)

				.on("mouseover", (event, d) => {
					tooltip.style.opacity = 1;
					tooltip.innerHTML = `${xVariable}: ${d[xVariable]}<br>${groupVariable}: ${d[groupVariable]}<br>${yVariable}: ${d[yVariable]}`;
					d3.select(event.target).style("stroke", "black").style("opacity", 1);
					tooltip.style.left = (d3.pointer(event)[0] + this.getBoundingClientRect().x + this.width /2 + + window.scrollX + 30) + "px";
					tooltip.style.top = (d3.pointer(event)[1] + this.getBoundingClientRect().y + window.scrollY +50) + "px";
				})
				.on("mousemove", (event) => {
					tooltip.style.left = (d3.pointer(event)[0] + this.getBoundingClientRect().x + this.width /2 + + window.scrollX + 30) + "px";
					tooltip.style.top = (d3.pointer(event)[1] + this.getBoundingClientRect().y + window.scrollY +50) + "px";
				})
				.on("mouseleave", (event) => {
					tooltip.style.opacity = 0;
					d3.select(event.target).style("stroke", "none").style("opacity", 1);
				});
		});
	}
	
	drawRegularChart(data, x, y, xVariable, yVariable, isHorizontal, colorVariable, hasColors, tooltip) {
		this.svg.append("g")
			.selectAll("rect")
			.data(data)
			.join("rect")
			// Set position and size based on chart orientation
			.attr(isHorizontal ? "x" : "y", d => isHorizontal ? x(0) + 0.5 : y(d[yVariable]))
            .attr(isHorizontal ? "y" : "x", d => isHorizontal ? y(d[xVariable]) :  x(d[xVariable]))
			.attr(isHorizontal ? "width" : "height", d => {
				if (isHorizontal) {
					const xVal = x(d[yVariable]);
					if (isNaN(xVal)) return 0;
					const xZero = x.range()[0];
					return xVal - xZero;
				} else {
					const yVal = y(d[yVariable]);
					if (isNaN(yVal)) return 0;
					const yZero = y.range()[0]; 
					return yZero - yVal;
				}
			})
			
			.attr(isHorizontal ? "height" : "width", isHorizontal ? y.bandwidth() : x.bandwidth())
			// Set bar color using color variable or fallback color
			.attr("fill", d => d.color || (hasColors ? this.colorScale(d[colorVariable]) : colorVariable))

			// Tooltip mouse events
			.on("mouseover", (event, d) => {
				tooltip.style.opacity = 1;
				tooltip.innerHTML = `${xVariable}: ${d[xVariable]}<br>${yVariable}: ${d[yVariable]}`;
				d3.select(event.target).style("stroke", "black").style("opacity", 1);
				tooltip.style.left = (d3.pointer(event)[0] + this.getBoundingClientRect().x + this.width /2 + + window.scrollX + 30) + "px";
				tooltip.style.top = (d3.pointer(event)[1] + this.getBoundingClientRect().y + window.scrollY + 50) + "px";
			})
			.on("mousemove", (event) => {
				tooltip.style.left = (d3.pointer(event)[0] + this.getBoundingClientRect().x + this.width /2 + + window.scrollX + 30) + "px";
				tooltip.style.top = (d3.pointer(event)[1] + this.getBoundingClientRect().y + window.scrollY +50) + "px";

				// tooltip.style.left = (d3.pointer(event)[0] + this.width ) + "px";
                // tooltip.style.top = (d3.pointer(event)[1] + this.height ) + "px";

			})
			.on("mouseleave", (event) => {
				tooltip.style.opacity = 0;
				d3.select(event.target).style("stroke", "none").style("opacity", 1);
			});
	}
	
	getStackedData(data, xVariable, yVariable, stackVariable, stackKeys, normalize = false) {
		if (!normalize) {
			return d3.stack()
				.keys(stackKeys)
				.value(([, d], key) => d.get(key)[yVariable])
				(d3.index(data, d => d[xVariable], d => d[stackVariable]));
		}
	
		// Normalize logic
		const grouped = d3.group(data, d => d[xVariable]);
		const normalizedData = [];
	
		for (const [groupKey, values] of grouped.entries()) {
			const total = d3.sum(values, d => +d[yVariable]);
			stackKeys.forEach(key => {
				const item = values.find(d => d[stackVariable] === key);
				normalizedData.push({
					[xVariable]: groupKey,
					[stackVariable]: key,
					[yVariable]: item ? (+item[yVariable] / total) : 0
				});
			});
		}
	
		return d3.stack()
			.keys(stackKeys)
			.value(([, d], key) => d.get(key)?.[yVariable] || 0)
			(d3.index(normalizedData, d => d[xVariable], d => d[stackVariable]));
	}

	renderStackedBars(stackedData, x, y, isHorizontal, xVariable, yVariable, stackVariable, tooltip) {
		const bars = this.svg.append("g")
			.selectAll("g")
			.data(stackedData)
			.join("g")
			.attr("fill", d => this.stackColorScale(d.key));

		bars.selectAll("rect")
			.data(d => d.map(entry => ({
				...entry,
				key: d.key,
				xValue: entry.data[0]
			})))
			.join("rect")
			.attr("x", d => isHorizontal ? x(d[0]) : x(d.data[0]))
			.attr("y", d => isHorizontal ? y(d.data[0]) : y(d[1]))
			.attr("height", d => isHorizontal ? y.bandwidth() : y(d[0]) - y(d[1]))
			.attr("width", d => isHorizontal ? x(d[1]) - x(d[0]) : x.bandwidth())
			.on("mouseover", (event, d) => {
				tooltip.style.opacity = 1;
				tooltip.innerHTML = `
					${xVariable}: ${d.xValue}<br>
					${stackVariable}: ${d.key}<br>
					${yVariable}: ${Math.round(d[1] - d[0])}
				`;
				d3.select(event.target).style("stroke", "black").style("opacity", 1);
				tooltip.style.left = (d3.pointer(event)[0] + this.getBoundingClientRect().x + this.width /2 + + window.scrollX + 30) + "px";
				tooltip.style.top = (d3.pointer(event)[1] + this.getBoundingClientRect().y + window.scrollY  + 50) + "px";
			})
			.on("mousemove", (event) => {
				tooltip.style.left = (d3.pointer(event)[0] + this.getBoundingClientRect().x + this.width /2 + + window.scrollX + 30) + "px";
				tooltip.style.top = (d3.pointer(event)[1] + this.getBoundingClientRect().y+ window.scrollY  + 50) + "px";
			})
			.on("mouseleave", (event) => {
				tooltip.style.opacity = 0;
				d3.select(event.target).style("stroke", "none").style("opacity", 1);
			});
	}
	
	// Render color pickers for each bar based on data
	renderLegend(colorField) {
		const container = this.shadowRoot.querySelector(".legend-container");
		const colorVariable = this.#encoding.color?.field;
		container.style.width = this.legendWidth + 'px';
		container.style.height = this.legendHeight + 'px';
		container.style.display = "block"; // Ensure the color picker container is visible
		const fontSize = Math.max(4, this.legendHeight * 0.03); 
		const inputSize = Math.max(10, this.legendHeight * 0.05);
		const marginBottom = this.legendHeight * 0.02;

		colorField.forEach((d, index) => {
			const colorItem = document.createElement("div");
			colorItem.classList.add("color-item");
			colorItem.style.fontSize = `${fontSize}px`;
			colorItem.style.marginBottom = `${marginBottom}px`;

			const label = document.createElement("label");
			label.textContent = d; // Set the text label to the unique language name

			const input = document.createElement("input");
			input.type = "color"; // Create a color input element
			input.style.width = input.style.height = `${inputSize}px`;

			input.value = d3.color(this.colorScale(d)).formatHex(); // Set the initial color from the color scale
			input.setAttribute("data-index", index); // Store index data for reference

			colorItem.appendChild(input);
			colorItem.appendChild(label); // Append to color item container
			container.appendChild(colorItem);

			// Add event listener to handle color changes
			input.addEventListener("input", (event) => this.updateColor(event, colorVariable, d));
		});
	}

	renderStackLegend(stackKeys, stackColorScale) {
		const container = this.shadowRoot.querySelector(".legend-container");
		container.style.width = this.#legendWidth + 'px';
		container.style.height = this.legendHeight + 'px';
		const legendTitle = container.querySelector(".legend-title");
		legendTitle.style.fontSize = this.legendHeight * 0.04 + 'px';
		if (!legendTitle) {
			const titleEl = document.createElement("div");
			titleEl.className = "legend-title";
			container.appendChild(titleEl);
		}

		const fontSize = Math.max(4, this.legendHeight * 0.03); 
		const inputSize = Math.max(10, this.legendHeight * 0.05);
		const marginBottom = this.legendHeight * 0.02;
		// Clear only color items, not the title
		container.querySelectorAll(".color-item").forEach(el => el.remove());

	
		stackKeys.forEach((key, index) => {
			const colorItem = document.createElement("div");
			colorItem.classList.add("color-item");
			colorItem.style.fontSize = `${fontSize}px`;
			colorItem.style.marginBottom = `${marginBottom}px`;

			const label = document.createElement("label");
			label.textContent = key;
	
			const input = document.createElement("input");
			input.type = "color";
			input.style.width = input.style.height = `${inputSize}px`;
			input.value = d3.color(stackColorScale(key)).formatHex();
			input.setAttribute("data-key", key);
			
			colorItem.appendChild(input);
			colorItem.appendChild(label);
			container.appendChild(colorItem);
	
			input.addEventListener("input", (event) => this.updateStackColor(event, key, stackColorScale));
		});
	}

	updateStackColor(event, key, stackColorScale) {
		const newColor = event.target.value;
	
		// Update color in stackColorScale
		stackColorScale.domain().forEach(d => {
			if (d === key) {
				const index = stackColorScale.domain().indexOf(d);
				const colors = stackColorScale.range();
				colors[index] = newColor;
				stackColorScale.range(colors);
			}
		});
	
		// Find all rects related to key and update color
		this.svg.selectAll("g") // Find all group (g) of stacked bars
			.filter(d => d && d.key === key) // Filter to key of stack
			.selectAll("rect") // Choose all rect in that group
			.transition()
			.duration(300)
			.attr("fill", newColor);
	
	
		// Save data after updating
		this.#dataValue = JSON.stringify(this.#data); // Update data
	}
	
	// Add event listeners to update color
	updateColor(event, colorVariable, label) {
		let listColorCriteria = this.#data.map(d => d[colorVariable]); // Get list of color-related data attributes
		const indexs = getAllIndexes(listColorCriteria, label); // Find all indexes of the current label
		for (const index of indexs) {
		  const newColor = event.target.value; // Get the new color selected by the user
		  this.#data[index].color = newColor; // Update color in dataset
		  const rect = this.shadowRoot.querySelectorAll("rect")[index]; // Get the corresponding pie chart segment
		  d3.select(rect)
			.transition()
			.duration(300)
			.attr("fill", newColor);
		}
		// this.#coreData.data.values = data;
		// this.#data = data;
		this.#dataValue = JSON.stringify(this.#data); // Update data
	}

	// Getter
	get dataValue() {
	  return this.#dataValue;
	}

	// Setter
	set dataValue(data) {
	  this.#dataValue = data;
	}

	// Getter cho `legend`
	get legend() {
		return this.hasAttribute('legend') ? this.getAttribute('legend') === 'true' : false;
	}

	// Setter cho `legend`
	set legend(value) {
		if (value) {
			this.setAttribute('legend', 'true');
		} else {
			this.removeAttribute('legend');
		}
	}

	// Getter cho `width`
get width() {
    return this.hasAttribute('width') ? parseInt(this.getAttribute('width')) : 600;
}

// Setter cho `width`
set width(value) {
    this.setAttribute('width', value);
}

// Getter cho `height`
get height() {
    return this.hasAttribute('height') ? parseInt(this.getAttribute('height')) : 400;
}

// Setter cho `height`
set height(value) {
    this.setAttribute('height', value);
}
  }

  customElements.define('bar-chart', BarChart);

// PieChart Class
class PieChart extends HTMLElement {
  #dataValue = '';
	#data = null;
	#width = 400;
	#height = 400;
	#svg = null;
	#defaultColor = "#cccccc";
  #description = '';
	#encoding = null;
  
  constructor() {
    super();
    this.data = null;
    this.attachShadow({ mode: "open" });
  }

  //Specify the properties to track changes
  static get observedAttributes() {
		return ['data', 'width', 'height', 'description', 'encoding', 'legend'];
	}

	connectedCallback() {
	  this.render();
	}

	attributeChangedCallback(name, oldValue, newValue) {
	if (newValue == null) return;

		try {
			switch (name) {
				case 'width':
					this.width = parseInt(newValue);
					break;
				case 'height':
					this.height = parseInt(newValue);
					break;
				case 'description':
					this.#description = newValue;
					this.removeAttribute(name);
					break;
				case 'data':
					this.#data = dataParser(newValue);
					this.removeAttribute(name);
					break;
				case 'encoding':
					this.#encoding = encodingParser(newValue);
					this.removeAttribute(name);
					// this.#encoding = JSON.parse(newValue);
					break;
				case 'legend':
					this.legend = newValue === "true";
					this.removeAttribute(name);
					break;
			}
		} catch (e) {
			console.error(`Invalid value for ${name}`, e);
		}

		// Render when data & encoding is ready
		if (this.#data && this.#encoding) {
			this.drawChart();
		}
	}

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host { 
          display: block; 
          width: 100%; 
          height: 100%; 
          position: relative; 
        }

        .main-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 100%;
          height: 100%;
        }

        .content {
          display: flex;
          flex-direction: row; 
          align-items: center;
          justify-content: center;
          gap: 20px;
          width: 100%;
        }

        .chart-container {
          display: flex;
          flex-direction: column; 
          align-items: center;
        }

        .color-picker-container { 
          display: flex; 
          flex-direction: column;
          align-items: center;
          width: 220px;
          gap: 5px;
          margin-left: 20px;
        }
          
        .legend-title {
          font-weight: bold;
          font-size: 20px;
          margin-bottom: 10px;
          text-align: center;
          color: black; 
          padding: 5px; 
        }
          
        .color-item { 
          display: flex; 
          align-items: center; 
          font-size: 14px; 
          gap: 10px;
          margin-bottom: 5px; 
        }

        .color-item label { 
          min-width: 150px; 
          font-weight: bold; 
          text-align: left;
        }

        .color-item input { 
          width: 30px; 
          height: 30px; 
          border: none; 
          border: 1px solid #ccc;
          cursor: pointer;
        }

        .close-popup:hover { background: #c82333; }

        .tooltip {
          position: absolute;
          opacity: 0;
          background: white;
          border: solid 1px black;
          border-radius: 5px;
          padding: 5px;
          font-size: 14px;
          pointer-events: auto;
          transition: opacity 0.2s;
          z-index: 9999;
        }

        .controls {
          width: 250px;
          display: flex;
          flex-direction: column;
          gap: 5px;
          align-items: flex-start;
        }

        .controls label {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 200px; 
        }

        .controls input[type="range"] {
          flex-grow: 1; 
          margin-left: 10px;
        }

        .sort-container {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 200px;
          padding: 5px 0;
        }

        .sort-container label {
          flex-grow: 1;
        }
          
        .sort-container input {
          margin-left: 10px;
        }

        .description {
          text-align: center;
          font-size: 22px;
          font-weight: bold;
          margin-bottom: 40px;
          display: block;
          width: 100%;
        }

      </style>
      <div class="main-container">
        <div class="content">
          <div class="color-picker-container">
            <div class="legend-title"></div>
          </div>

          <div class="chart-container">
            <svg></svg>
					  <div class="description"></div>
          </div>
          <div class="tooltip"></div>
        </div>
      </div>
    `;
  }

  togglePopup(show) {
    const popup = this.shadowRoot.querySelector(".popup");
    popup.classList.toggle("show", show);
  }

  drawChart() {
    const tooltip = this.shadowRoot.querySelector(".tooltip");

		let data = this.#data;
    const svgElement = this.shadowRoot.querySelector('svg');
    d3.select(svgElement).selectAll("g").remove();
    this.#svg = d3.select(svgElement)
      .attr("width", this.#width).attr("height", this.#height).style("margin", "50px")
      .append("g").attr("transform", `translate(${this.#width / 2}, ${this.#height / 2})`);

    const radius = Math.min(this.#width, this.#height) / 2;
    const textVariable = this.#encoding.text?.field || null;
		const thetaVariable = this.#encoding.theta?.field || null;

    this.textVariable = textVariable;
    this.thetaVariable = thetaVariable;
    
    const legendDescription = this.shadowRoot.querySelector(".legend-title");
    legendDescription.textContent = this.#encoding.color?.title;

    const colorVariable = this.#encoding.color?.field || this.#defaultColor;

    // Color scale
    const hasColors = data.some(d => d[colorVariable]);
    let colorField = hasColors ? [...new Set(data.map(d => d[colorVariable]))] : [];
    let colorScale = this.#encoding.color?.scale || null;
    let colorDomain = Array.isArray(colorScale?.domain) ? colorScale.domain : [];
    let rawColorRange = colorScale?.range;

    if (colorScale) {
      this.colorScale = d3.scaleOrdinal();
    }

    // Use function createColorScale from color-utils.js
    const { scale, domain } = createColorScale({
          domain: colorDomain,
          range: rawColorRange,
          dataKeys: colorField,
          fallbackInterpolator: t => d3.interpolateTurbo(t * 0.8 + 0.1),
          label: "Pie"
        });
        this.colorScale = scale;
        this.finalColorDomain = domain;

    // Define arc shape
    const arcShape = d3.arc()
      .innerRadius(0)
      .outerRadius(radius - 0.9)
      .cornerRadius(0);
      
    const arcShapeLabels = d3.arc().outerRadius(radius - 0.85).innerRadius(radius * 0.6);
    const pie = d3.pie()
      .value(d => {
  return +d[this.thetaVariable];
})
      .sort(null);

    const pieData = pie(data);

    // Draw pie chart segments
    this.paths = this.#svg.selectAll("path")
      .data(pieData)
      .join("path")
      .attr("fill", d => hasColors ? this.colorScale(d.data[colorVariable]) : colorVariable) // Use provided color or generate one
      .attr("d", arcShape)
      .attr("stroke", "white")
      .on("click", (event, d) => alert(`Clicked on: ${d.data[this.textVariable]}, ${d.data[this.thetaVariable]}`))
      .on("mouseover", (event, d) => {
        tooltip.style.opacity = 1;
        tooltip.innerHTML = `<strong>${d.data[this.textVariable]}</strong>: ${d.data[this.thetaVariable]}`;
        d3.select(event.target).style("stroke", "black").style("opacity", 1);
      })
      .on("mousemove", (event) => {
        tooltip.style.left = (d3.pointer(event)[0] + this.#width) + "px";
        tooltip.style.top = (d3.pointer(event)[1] + this.#height - 100) + "px";
      })
      .on("mouseout", (event) => {
        tooltip.style.opacity = 0;
        d3.select(event.target).style("stroke", "white").style("opacity", 1);
      });


      // Display chart description
      const chartDescription = this.shadowRoot.querySelector(".description");
      chartDescription.textContent = this.#description;

    const textGroup = this.#svg.append("g")
      .attr("font-family", "arial")
      .attr("font-size", "12px")
      .attr("font-weight", 500)
      .attr("text-anchor", "middle");

      textGroup.selectAll("text")
      .data(pieData)
      .join("text")
      .attr("transform", d => {
        const centroid = arcShapeLabels.centroid(d);
        return `translate(${centroid[0]},${centroid[1]})`;
      })
      .each(function(d) {
        const textElement = d3.select(this);

        textElement.append("tspan")
          .attr("x", 0)
          .attr("dy", "0em");
          // .text(displayText);

        textElement.append("tspan")
          .attr("x", "0")
          .attr("dy", "1.0em")
          .text((d.data[thetaVariable] / 1_000_000).toFixed(1) + " M");
      });

      // Check hasColors
      if (this.legend && hasColors) {
        this.renderColorPickers(this.finalColorDomain);
        this.shadowRoot.querySelector(".color-picker-container").style.display = "flex";

      } else {
			this.shadowRoot.querySelector(".color-picker-container").style.display = "none";
      }
  }

  // Render color pickers for each bar based on data
    renderColorPickers(colorField) {
      const container = this.shadowRoot.querySelector(".color-picker-container");
      const colorVariable = this.#encoding.color?.field;
      container.style.display = "block"; // Ensure the color picker container is visible
      colorField.forEach((d, index) => {
        const colorItem = document.createElement("div");
        colorItem.classList.add("color-item");
  
        const label = document.createElement("label");
        label.textContent = d; // Set the text label
  
        const input = document.createElement("input");
        input.type = "color"; // Create a color input element
        input.value = d3.color(this.colorScale(d)).formatHex(); // Set the initial color from the color scale
        input.setAttribute("data-index", index); // Store index data for reference
  
        
        colorItem.appendChild(input);
        colorItem.appendChild(label); // Append to color item container
        container.appendChild(colorItem);
  
        // Add event listener to handle color changes
        input.addEventListener("input", (event) => this.updateColor(event, colorVariable, d));
      });
    }

  // Add event listeners to update color
  updateColor(event, colorVariable, label) {
    let listColorCriteria = this.#data.map(d => d[colorVariable]); // Get list of color-related data attributes
    const indexs = getAllIndexes(listColorCriteria, label); // Find all indexes of the current label
    for (const index of indexs) {
      const newColor = event.target.value; // Get the new color selected by the user
      this.#data[index].color = newColor; // Update color in dataset
      const path = this.shadowRoot.querySelectorAll("path")[index]; // Get the corresponding pie chart segment
      d3.select(path)
        .transition()
        .duration(300)
        .attr("fill", newColor);
    }
    this.#dataValue = JSON.stringify(this.#data); // Update data
  }

  get dataValue() {
    return this.#dataValue;
  }

  set dataValue(data) {
    this.#dataValue = data;
  }
}

customElements.define("pie-chart", PieChart);

// import * as d3 from 'd3';

class NodeLinkChart extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
    }
  
    static get observedAttributes() {
      return ['data'];
    }
  
    connectedCallback() {
      this.render();
    }
  
    attributeChangedCallback(name, oldValue, newValue) {
      this.drawChart();
    }
  
    render() {
      this.shadowRoot.innerHTML = `
        <style>
                .tooltip {
                  position: absolute;
                  opacity: 0;
                  background: white;
                  border: solid 1px black;
                  border-radius: 5px;
                  padding: 5px;
                  font-size: 14px;
                  pointer-events: auto;
                  transition: opacity 0.2s;
                  z-index: 9999;
                }
        </style>
        <svg></svg>
        <div class="tooltip" id="tooltip"></div>
      `;
    }
  
    drawChart() {
      const data = JSON.parse(this.getAttribute('data'));
      const svgElement = this.shadowRoot.querySelector('svg');
      const tooltip = this.shadowRoot.querySelector('#tooltip');
      const container = this.shadowRoot.host.getBoundingClientRect();
      const width = container.width || 400;
      const height = container.height || 400;
  
      d3.select(svgElement).selectAll("g").remove();
  
      const svg = d3.select(svgElement)
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", `translate(0, 0)`);
  
      // Initialize the links
      const link = svg
        .selectAll("line")
        .data(data.links)
        .join("line")
        .style("stroke", "#aaa");
  
      // Initialize the nodes
      const node = svg
        .selectAll("circle")
        .data(data.nodes)
        .join("circle")
        .attr("r", 20)
        .style("fill", "#69b3a2");
  
      // Force simulation
      const simulation = d3.forceSimulation(data.nodes)
        .force("link", d3.forceLink().id(d => d.id).links(data.links).distance(80)) // Khoảng cách giữa các node
        .force("charge", d3.forceManyBody().strength(-200)) // Lực đẩy giảm xuống
        .force("center", d3.forceCenter(width / 2, height / 2)) // Giữ node ở giữa
        .force("collide", d3.forceCollide().radius(20)) // Tránh node bị đẩy quá xa
        .on("tick", ticked);

  
      function ticked() {
          link
            .attr("x1", function(d) {
              // Giới hạn vị trí x của điểm bắt đầu của link để không ra ngoài cửa sổ
              return Math.max(20, Math.min(width - 20, d.source.x)); // Giới hạn x của điểm bắt đầu
            })
            .attr("y1", function(d) {
              // Giới hạn vị trí y của điểm bắt đầu của link để không ra ngoài cửa sổ
              return Math.max(20, Math.min(height - 20, d.source.y)); // Giới hạn y của điểm bắt đầu
            })
            .attr("x2", function(d) {
              // Giới hạn vị trí x của điểm kết thúc của link để không ra ngoài cửa sổ
              return Math.max(20, Math.min(width - 20, d.target.x)); // Giới hạn x của điểm kết thúc
            })
            .attr("y2", function(d) {
              // Giới hạn vị trí y của điểm kết thúc của link để không ra ngoài cửa sổ
              return Math.max(20, Math.min(height - 20, d.target.y)); // Giới hạn y của điểm kết thúc
            });
        
          node
            .attr("cx", function(d) {
              // Giới hạn vị trí x của node để không ra ngoài
              return Math.max(20, Math.min(width - 20, d.x)); // Giới hạn x giữa 20 và width - 20
            })
            .attr("cy", function(d) {
              // Giới hạn vị trí y của node để không ra ngoài
              return Math.max(20, Math.min(height - 20, d.y)); // Giới hạn y giữa 20 và height - 20
            });
      }
  
      // Adding drag functionality to nodes
      node.call(d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended));
  
      function dragstarted(event) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
      }
  
      function dragged(event) {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
      }
  
      function dragended(event) {
        if (!event.active) simulation.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;
      }
      
      // Show tooltip on hover
      // Show tooltip on hover
      node.on("mouseover", (event, d) => {
        // Set the tooltip text and visibility using textContent
        tooltip.style.opacity = 1;
        tooltip.innerHTML = `<strong>${d.name}</strong>`;
        d3.select(event.target).style("stroke", "black").style("opacity", 1); // Use direct manipulation for visibility
      })
      .on("mousemove", (event) => {
        tooltip.style.left = (d3.pointer(event)[0] + width/5) + "px";
        tooltip.style.top = (d3.pointer(event)[1] + height) + "px";
      })
      .on("mouseout", (event) => {
          // Hide the tooltip when mouseout
        tooltip.style.opacity = 0;
        d3.select(event.target).style("stroke", "white").style("opacity", 1);
      });
    }
  }
  
  customElements.define('nodelink-chart', NodeLinkChart);

var thirdPi = Math.PI / 3,
    angles = [0, thirdPi, 2 * thirdPi, 3 * thirdPi, 4 * thirdPi, 5 * thirdPi];

function pointX(d) {
  return d[0];
}

function pointY(d) {
  return d[1];
}

function d3Hexbin() {
  var x0 = 0,
      y0 = 0,
      x1 = 1,
      y1 = 1,
      x = pointX,
      y = pointY,
      r,
      dx,
      dy;

  function hexbin(points) {
    var binsById = {}, bins = [], i, n = points.length;

    for (i = 0; i < n; ++i) {
      if (isNaN(px = +x.call(null, point = points[i], i, points))
          || isNaN(py = +y.call(null, point, i, points))) continue;

      var point,
          px,
          py,
          pj = Math.round(py = py / dy),
          pi = Math.round(px = px / dx - (pj & 1) / 2),
          py1 = py - pj;

      if (Math.abs(py1) * 3 > 1) {
        var px1 = px - pi,
            pi2 = pi + (px < pi ? -1 : 1) / 2,
            pj2 = pj + (py < pj ? -1 : 1),
            px2 = px - pi2,
            py2 = py - pj2;
        if (px1 * px1 + py1 * py1 > px2 * px2 + py2 * py2) pi = pi2 + (pj & 1 ? 1 : -1) / 2, pj = pj2;
      }

      var id = pi + "-" + pj, bin = binsById[id];
      if (bin) bin.push(point);
      else {
        bins.push(bin = binsById[id] = [point]);
        bin.x = (pi + (pj & 1) / 2) * dx;
        bin.y = pj * dy;
      }
    }

    return bins;
  }

  function hexagon(radius) {
    var x0 = 0, y0 = 0;
    return angles.map(function(angle) {
      var x1 = Math.sin(angle) * radius,
          y1 = -Math.cos(angle) * radius,
          dx = x1 - x0,
          dy = y1 - y0;
      x0 = x1, y0 = y1;
      return [dx, dy];
    });
  }

  hexbin.hexagon = function(radius) {
    return "m" + hexagon(radius == null ? r : +radius).join("l") + "z";
  };

  hexbin.centers = function() {
    var centers = [],
        j = Math.round(y0 / dy),
        i = Math.round(x0 / dx);
    for (var y = j * dy; y < y1 + r; y += dy, ++j) {
      for (var x = i * dx + (j & 1) * dx / 2; x < x1 + dx / 2; x += dx) {
        centers.push([x, y]);
      }
    }
    return centers;
  };

  hexbin.mesh = function() {
    var fragment = hexagon(r).slice(0, 4).join("l");
    return hexbin.centers().map(function(p) { return "M" + p + "m" + fragment; }).join("");
  };

  hexbin.x = function(_) {
    return arguments.length ? (x = _, hexbin) : x;
  };

  hexbin.y = function(_) {
    return arguments.length ? (y = _, hexbin) : y;
  };

  hexbin.radius = function(_) {
    return arguments.length ? (r = +_, dx = r * 2 * Math.sin(thirdPi), dy = r * 1.5, hexbin) : r;
  };

  hexbin.size = function(_) {
    return arguments.length ? (x0 = y0 = 0, x1 = +_[0], y1 = +_[1], hexbin) : [x1 - x0, y1 - y0];
  };

  hexbin.extent = function(_) {
    return arguments.length ? (x0 = +_[0][0], y0 = +_[0][1], x1 = +_[1][0], y1 = +_[1][1], hexbin) : [[x0, y0], [x1, y1]];
  };

  return hexbin.radius(1);
}

// import * as d3 from 'd3';

class MapChart extends HTMLElement {
    #dataValue = '';
    #coreData = null;
    #data = null;
    #width = 400;
    #height = 400;
    #description = '';
    #projection = '';
    #mark = '';
    #url = '';
    #encoding = null;
    #svg = null;
    #node = '';
    #link = '';

    constructor() {
        super();
        this.data = null;
        this.attachShadow({ mode: "open" });
     }

    static get observedAttributes() {
		return ['data', 'width', 'height', 'description', 'encoding', 'legend', 'projection', 'mark', 'node', 'link'];
	}

	connectedCallback() {
	  this.render();
	}

	attributeChangedCallback(name, oldValue, newValue) {
	if (newValue == null) return;

		try {
			switch (name) {
				case 'width':
					this.width = parseInt(newValue);
					break;
				case 'height':
					this.height = parseInt(newValue);
					break;
				case 'description':
					this.#description = newValue;
					this.removeAttribute(name);
					break;
				case 'data':
                    const parsed = JSON.parse(newValue);
                    this.#url = parsed.url;
					this.#data = dataParser(newValue);
					this.removeAttribute(name);
                    if (this.#data && this.#encoding) {
                        this.drawChart();
                    }
					break;
                case 'node':
                    const parsedNode = JSON.parse(newValue);
                    this.#node = parsedNode.url;
					this.removeAttribute(name);
                    if (this.#data && this.#encoding) {
                        this.drawChart();
                    }
					break;
                case 'link':
                    const parsedLink = JSON.parse(newValue);
                    this.#link = parsedLink.url;
					this.removeAttribute(name);
                    if (this.#data && this.#encoding) {
                        this.drawChart();
                    }
					break;
                case 'projection':
					this.projection = newValue;
					break;
                case 'mark':
                    this.mark = newValue;
                    break;
				case 'encoding':
					this.#encoding = encodingParser(newValue);
					this.removeAttribute(name);
                    if (this.#data && this.#encoding) {
                        this.drawChart();
                    }
					// this.#encoding = JSON.parse(newValue);
					break;
				case 'legend':
					this.legend = newValue === "true";
					this.removeAttribute(name);
					break;
			}
		} catch (e) {
			console.error(`Invalid value for ${name}`, e);
		}
		
	}



    render() {
        this.shadowRoot.innerHTML = `
            <style>
            .container {
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100%;
            }
    
            svg {
                font: 10px sans-serif;
                display: block;
            }
    
            .tooltip {
                position: absolute;
                background: rgba(255, 255, 255, 0.9);
                border: 1px solid #ddd;
                padding: 8px;
                font-size: 12px;
                pointer-events: none;
                opacity: 0;
            }

            .land {
                fill: #ddd;
            }

            .states {
                fill: none;
                stroke: #fff;
            }

            .airport-arc {
                fill: none;
            }

            .airport:hover .airport-arc {
                stroke: #f00;
            }

            .airport-cell {
                fill: none;
                stroke: #000;
                stroke-opacity: 0.1;
                pointer-events: all;
            }

            </style>
            <script src="https://d3js.org/topojson.v1.min.js"></script>
            
            <div class="tooltip"></div>
            <div class="container">
                <svg width="960" height="600"></svg>
            </div>
        `;
    }

    drawChart() {
        this.#data;
        const svgElement = this.shadowRoot.querySelector('svg');
        d3.select(svgElement).selectAll("g").remove();
        this.#svg = d3.select(svgElement)
            .attr("width", this.width)
            .attr("height", this.height);
        if (this.mark === "geoShape") {
            this.drawGeoChart();
        } else if (this.mark === "connective") {
            this.drawConnectionMap();
        } else if (this.mark === "point") {
            this.drawBubbleMap();
        } else if (this.mark === "hexbin") {
            this.drawHexbinMap();
        } else {
            console.warn("Unable to determine chart type from metadata");
        }
    }
    
    
    drawHexbinMap() {

        let projection;
        if(this.projection === "mercator") {
        // Projection setup
            projection = d3.geoMercator()
            // .center([0, 20])
            .scale(80)
            .translate([this.width / 2, this.height / 2]);
        }
        
            
        d3.geoPath().projection(projection);
    
        // attach with data's url
        Promise.all([
            d3.json(this.#url),
            d3.csv("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/data_gpsLocSurfer.csv")
        ]).then(([geoData, pointData]) => {
        
            // Check data is TopoJSON or GeoJSON
            if (geoData.objects) {
                // Data is TOopoJSON
                geoData = topojson.feature(geoData, geoData.objects.land);  // Convert from TopoJSON to GeoJSON
            }
    
            // Transfer data from lon/lat to projected
            pointData.forEach(d => {
                d.projected = projection([+d.homelon, +d.homelat]);
            });
    
            const points = pointData.map(d => d.projected).filter(Boolean);
    
            // Create hexbin
            const hexbin = d3Hexbin()
                .radius(5);
    
            const bins = hexbin(points);
    
            // color scale
            const color = d3.scaleSequential(d3.interpolateYlOrRd)
                .domain([0, d3.max(bins, d => d.length)]);
    
            // // draw map
            // this.#svg.append("g")
            //     .selectAll("path")
            //     .data(geoData.features)  // data in geoJSON
            //     .enter()
            //     .append("path")
            //     .attr("fill", "#e0e0e0")
            //     .attr("d", path)
            //     .attr("stroke", "#999");

            // Draw map
            this.#svg.append("g")
            .selectAll("path")
            .data(geoData.features)
            .enter()
            .append("path")
                .attr("fill", "#b8b8b8")
                .attr("d", d3.geoPath()
                    .projection(projection)
                )
                .style("stroke", "none")
                .style("opacity", 3);
    
            // draw hexbinGroup
            const hexbinGroup = this.#svg.append("g")
                .attr("class", "hexbin-layer");
    
            hexbinGroup.selectAll(".hexagon")
                .data(bins, d => `${d.x},${d.y}`)
                .enter().append("path")
                .attr("class", "hexagon")
                .attr("d", hexbin.hexagon())
                .attr("transform", d => `translate(${d.x}, ${d.y})`)
                .style("fill", d => color(d.length))
                .style("stroke", "#333")
                .style("stroke-width", 0.2)
                .style("fill-opacity", 0.8);
    
            // Tooltip
            const tooltip = d3.select(this.shadowRoot.querySelector(".tooltip"));
    
            hexbinGroup.selectAll(".hexagon")
                .on("mouseover", (event, d) => {
                    tooltip.transition().duration(200).style("opacity", 1);
                    tooltip.html(`<strong>${d.length}</strong> surfers in this area`)
                        .style("left", (event.pageX + 10) + "px")
                        .style("top", (event.pageY - 28) + "px");
                })
                .on("mouseout", () => {
                    tooltip.transition().duration(500).style("opacity", 0);
                });
    
            // Legend
            const legendValues = [1, 50, 90];
    
            const legend = this.#svg.append("g")
                .attr("transform", `translate(${this.width - 120}, ${this.height/2 + 150})`);
    
            legendValues.forEach((val, i) => {
                const y = i * 20;
                legend.append("rect")
                    .attr("x", 0)
                    .attr("y", y)
                    .attr("width", 18)
                    .attr("height", 18)
                    .attr("fill", color(val));
    
                legend.append("text")
                    .attr("x", 25)
                    .attr("y", y + 13)
                    .text(`${val}+`)
                    .attr("font-size", "12px")
                    .attr("fill", "#333");
            });
    
        }).catch(err => {
            console.error("Error loading hexbin map data:", err);
        });
    }
    
    
    
    
    drawBubbleMap() {
        
        this.width;
        let height = this.height;
        // const geoData = this.#url;
        let projection;
        if(this.projection === "mercator") {
        // Projection setup
            projection = d3.geoMercator()
            // .center([0, 20])
            .scale(80)
            .translate([this.width / 2, this.height / 2]);
        }

        d3.geoPath().projection(projection);
    
        Promise.all([
            d3.json(this.#url),
            d3.csv("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/data_gpsLocSurfer.csv")
        ]).then(([geoData, bubbleData]) => {
    
        // Color scale
        const allContinents = [...new Set(bubbleData.map(d => d.homecontinent))];
        const color = d3.scaleOrdinal()
            .domain(allContinents)
            .range(d3.schemePaired);
    
        // Size scale
        const valueExtent = d3.extent(bubbleData, d => +d.n);
        const size = d3.scaleSqrt()
            .domain(valueExtent)
            .range([1, 50]);
    
        // Draw map
        this.#svg.append("g")
            .selectAll("path")
            .data(geoData.features)
            .enter()
            .append("path")
                .attr("fill", "#b8b8b8")
                .attr("d", d3.geoPath()
                    .projection(projection)
                )
                .style("stroke", "none")
                .style("opacity", 3);
    
        // === Tooltip ===
        const tooltip = d3.select(this.shadowRoot.querySelector(".tooltip"));
    
        // Draw bubbles
        this.#svg.selectAll("circle")
            .data(bubbleData.sort(function(a,b) { return +b.n - +a.n }).filter(function(d,i){ return i<1000 }))
            .enter()
            .append("circle")
                .attr("cx", function(d){ return projection([+d.homelon, +d.homelat])[0] })
                .attr("cy", function(d){ return projection([+d.homelon, +d.homelat])[1] })
                .attr("r", function(d){ return size(+d.n) })
                .style("fill", function(d){ return color(d.homecontinent) })
                .attr("stroke", function(d){ if(d.n>2000){return "black"}else {return "none"}  })
                .attr("stroke-width", 1)
                .attr("fill-opacity", .4)
                .on("mouseover", (event, d) => {
                    tooltip.transition().duration(200).style("opacity", 1);
                    tooltip.html(`
                        <strong>Continent:</strong> ${d.homecontinent}<br/>
                        <!-- ><strong>Country:</strong> ${d.homecountry}<br/> -->
                        <strong>Surfers:</strong> ${d.n}
                    `)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 28) + "px");
                })
                .on("mouseout", () => {
                    tooltip.transition().duration(500).style("opacity", 0);
                });
    
        // Title
        this.#svg.append("text")
            .attr("text-anchor", "end")
            .style("fill", "black")
            .attr("x", this.width - 10)
            .attr("y", this.height - 30)
            .attr("width", 90)
            .text("WHERE SURFERS LIVE")
            .style("font-size", 14);
    
        // Add legend: circles
        var valuesToShow = [100,4000,15000];
        var xCircle = 40;
        var xLabel = 90;
        this.#svg
            .selectAll("legend")
            .data(valuesToShow)
            .enter()
            .append("circle")
            .attr("cx", xCircle)
            .attr("cy", function(d){ return height - size(d)} )
            .attr("r", function(d){ return size(d) })
            .style("fill", "none")
            .attr("stroke", "black");

        // Add legend: segments
        this.#svg
            .selectAll("legend")
            .data(valuesToShow)
            .enter()
            .append("line")
            .attr('x1', function(d){ return xCircle + size(d) } )
            .attr('x2', xLabel)
            .attr('y1', function(d){ return height - size(d) } )
            .attr('y2', function(d){ return height - size(d) } )
            .attr('stroke', 'black')
            .style('stroke-dasharray', ('2,2'));

        // Add legend: labels
        this.#svg
            .selectAll("legend")
            .data(valuesToShow)
            .enter()
            .append("text")
            .attr('x', xLabel)
            .attr('y', function(d){ return height - size(d) } )
            .text( function(d){ return d } )
            .style("font-size", 10)
            .attr('alignment-baseline', 'middle');
            
        // === Color legend (continent) ===
        const legendContainer = this.#svg.append("g")
            .attr("transform", `translate(${this.width - 150}, 20)`);
    
        allContinents.forEach((continent, i) => {
            const legendRow = legendContainer.append("g")
            .attr("transform", `translate(0, ${i * 20})`);
    
            legendRow.append("rect")
            .attr("width", 12)
            .attr("height", 12)
            .attr("fill", color(continent));
    
            legendRow.append("text")
            .attr("x", 18)
            .attr("y", 10)
            .text(continent)
            .style("font-size", "12px")
            .attr("fill", "#333");
        });
    
        }).catch(error => {
        console.error("Error loading data:", error);
        });
    }      
    
    // drawConnectionMap() {
    drawConnectionMap() {
        const tooltip = this.shadowRoot.querySelector(".tooltip");
    
        const mapUrl = this.#url;
        const airportsUrl = this.#node;
        const flightsUrl = this.#link;
        const projectionType = this.projection;

        // const projection = d3.geoAlbersUsa()
        //     .scale(1280)
        //     .translate([this.#width / 2, this.#height / 2]);

        const projection = d3[`geo${projectionType.charAt(0).toUpperCase() + projectionType.slice(1)}`]()
    .fitSize([this.width, this.height], { type: "Sphere" });



        const path = d3.geoPath().projection(projection);
        
        const map = this.#svg.append("g").attr("class", "map");
        const routes = this.#svg.append("g").attr("class", "routes");
        const points = this.#svg.append("g").attr("class", "airports");

        d3.json(mapUrl).then(geoData => {
            const states = topojson.feature(geoData, geoData.objects.states).features;
            map.selectAll("path")
                .data(states)
                .enter()
                .append("path")
                .attr("d", path)
                .attr("fill", "#ddd")
                .attr("stroke", "#fff")
                .attr("stroke-width", 1);

            d3.csv(airportsUrl).then(airportsData => {
                d3.csv(flightsUrl).then(flightsData => {
                    const airportMap = new Map(airportsData.map(d => [d.iata, d]));
            

                    // Calculate the number of route flights from each airport
                    const routeCounts = {};
                    flightsData.forEach(flight => {
                        routeCounts[flight.origin] = (routeCounts[flight.origin] || 0) + 1;
                    });
    
                    const sizeScale = d3.scaleSqrt()
                    .domain([0, d3.max(Object.values(routeCounts))])
                    .range([0, 10]);
                    
                    const usedIATAs = new Set();
                    flightsData.forEach(flight => {
                        usedIATAs.add(flight.origin);
                        usedIATAs.add(flight.destination);
                    });
                    
                        // Put a filter for valid airports
                    const filteredAirports = airportsData.filter(d => usedIATAs.has(d.iata));
    
                    // Sort by the number of route flights
                    filteredAirports.sort((a, b) => (routeCounts[b.iata] || 0) - (routeCounts[a.iata] || 0));
    
                    points.selectAll("circle")
                        .data(filteredAirports)
                        .enter()
                        .append("circle")
                        .attr("cx", d => {
                            const coords = projection([+d.longitude, +d.latitude]);
                            return coords ? coords[0] : null;
                        })
                        .attr("cy", d => {
                            const coords = projection([+d.longitude, +d.latitude]);
                            return coords ? coords[1] : null;
                        })
                        .attr("r", d => sizeScale(routeCounts[d.iata] || 0))
                        .attr("fill", "steelblue") // Color for airports
                        .attr("fill-opacity", 0.5)
                        .attr("stroke", "none")
                        .on("mouseover", (event, d) => {
                            tooltip.innerHTML = `Airport: ${d.name} (${d.iata})<br>Routes: ${routeCounts[d.iata] || 0}`;
                            tooltip.style.opacity = 1;
                            tooltip.style.left = `${event.pageX + 10}px`;
                            tooltip.style.top = `${event.pageY}px`;

                            routes.selectAll("line").remove();

                            // Filter for valid flights
                            const relatedFlights = flightsData.filter(f =>
                                f.origin === d.iata || f.destination === d.iata
                            );
                            
                            relatedFlights.forEach(flight => {
                                const origin = airportMap.get(flight.origin);
                                const destination = airportMap.get(flight.destination);

                                if (origin && destination) {
                                    const originCoords = projection([+origin.longitude, +origin.latitude]);
                                    const destCoords = projection([+destination.longitude, +destination.latitude]);

                                    if (originCoords && destCoords) {
                                        routes.append("line")
                                            .attr("x1", originCoords[0])
                                            .attr("y1", originCoords[1])
                                            .attr("x2", destCoords[0])
                                            .attr("y2", destCoords[1])
                                            .attr("stroke", "#666")
                                            .attr("stroke-opacity", 0.5)
                                            .attr("stroke-width", 1);
                                    }
                                }
                            });
                        })
                        .on("mouseleave", () => {
                            tooltip.style.opacity = 0;
                            routes.selectAll("line").remove();
                        });

                });
            });
        });
    }    
    
  
    drawGeoChart() {
        const tooltip = this.shadowRoot.querySelector(".tooltip");
        const geoData = this.#url;
        const idVariable = this.#encoding.id?.field;
        const labelVariable = this.#encoding.label?.field;
        const labelData = new Map(this.#data.map(d => [d[idVariable], d[labelVariable]]));
        const valueVariable = this.#encoding.value?.field;
        const colorField = this.#encoding.color?.field;
        const colorRange = this.#encoding.color?.scale?.range || d3.schemeBlues[6];
        const colorValues = this.#data.map(d => d[colorField]);
        const colorData = new Map(this.#data.map(d => [d[idVariable], d[colorField]]));

        let projection;
        if (this.projection === "mercator") {
            projection = d3.geoMercator()
            .scale(70)
            .center([0, 20])
            .translate([this.width / 2, this.height / 2]);        }      
    
        const path = d3.geoPath().projection(projection);
        
        const userData = new Map(this.#data.map(d => [d[idVariable], d[valueVariable]]));

        
        const minColor = d3.min(colorValues);
        const maxColor = d3.max(colorValues);

        const colorScale = d3.scaleThreshold()
            .domain([
                minColor,
                (minColor + maxColor) / 8,
                (minColor + maxColor) / 6,
                (minColor + maxColor) / 4,
                (minColor + maxColor) / 2,
                maxColor / 1.5
            ])
            .range(colorRange);
        
        
        d3.json(geoData)
        // d3.json("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson")
            .then(geoData => {
                const zoom = d3.zoom()
                .scaleExtent([1, 8])
                .on("zoom", zoomed);
    
            this.#svg.call(zoom);
    
            const g = this.#svg.append("g");
    
            // Add legend
            const legendWidth = 300;
            const legendHeight = 20;
            const legendsvg = this.#svg.append("g")
            .attr("transform", `translate(${this.width / 2 - legendWidth / 2}, ${this.height - 40})`);
    
            const defs = this.#svg.append("defs");
            const linearGradient = defs.append("linearGradient")
            .attr("id", "legend-gradient")
            .attr("x1", "0%").attr("y1", "0%")
            .attr("x2", "100%").attr("y2", "0%");
    
            linearGradient.selectAll("stop")
            .data([
                { offset: "0%", color: colorScale(minColor) },
                { offset: "100%", color: colorScale(maxColor) }
            ])
            .enter().append("stop")
            .attr("offset", d => d.offset)
            .attr("stop-color", d => d.color);
    
            legendsvg.append("rect")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", legendWidth)
            .attr("height", legendHeight)
            .style("fill", "url(#legend-gradient)");
    
            const legendScale = d3.scaleLinear()
            .domain([minColor, maxColor])
            .range([0, legendWidth]);
    
            const legendAxis = d3.axisBottom(legendScale)
            .tickSize(legendHeight)
            .tickFormat(d => {
                if (d >= 1e9) return (d / 1e9) + "B";
                if (d >= 1e6) return (d / 1e6) + "M";
                if (d >= 1e3) return (d / 1e3) + "K";
                return d;
            })
            .ticks(5);
    
            legendsvg.append("g")
            .call(legendAxis)
            .select(".domain").remove();
    
            const legendPointer = legendsvg.append("polygon")
            .attr("points", "-6,-8 6,-8 0,0")
            .attr("fill", "black")
            .style("opacity", 0);
    
            const mouseOver = function (event, d) {
            const population = userData.get(d.id) || 0;

            d3.selectAll(".Country")
                .transition().duration(200)
                .style("opacity", 0.5);
            d3.select(this)
                .transition().duration(200)
                .style("opacity", 1)
                .style("stroke", "black");
    
            const label = labelData.get(d.id) || d.id;

            tooltip.innerHTML = `${label}: ${population.toLocaleString()}`;
            tooltip.style.opacity = 1;
            tooltip.style.left = `${event.pageX + 10}px`;
            tooltip.style.top = `${event.pageY}px`;
    
            const legendX = legendScale(population);
            legendPointer
                .attr("transform", `translate(${legendX}, 0)`)
                .style("opacity", 1);
            };
    
            const mouseLeave = function () {
            d3.selectAll(".Country")
                .transition().duration(200)
                .style("opacity", 0.8);
            d3.select(this)
                .transition().duration(200)
                .style("stroke", "transparent");
    
            tooltip.style.opacity = 0;
            legendPointer.style("opacity", 0);
            };
            
            const clicked = (event, d) => {
                const [[x0, y0], [x1, y1]] = path.bounds(d);
                event.stopPropagation();

                g.selectAll(".Country")
                    .transition().duration(200)
                    .attr("fill", d => d.originalColor);

                d3.select(event.currentTarget)
                    .transition().duration(200)
                    .attr("fill", "red");

                this.#svg.transition().duration(750).call(
                    zoom.transform,
                    d3.zoomIdentity
                        .translate(this.width / 2, this.height / 2)
                        .scale(Math.min(8, 0.9 / Math.max((x1 - x0) / this.width, (y1 - y0) / this.height)))
                        .translate(-(x0 + x1) / 2, -(y0 + y1) / 2),
                    d3.pointer(event, this.#svg.node())
                );
            };
            
            function zoomed(event) {
                const { transform } = event;
                g.attr("transform", transform);
                g.selectAll(".Country").attr("stroke-width", 1 / transform.k);
            }
    
            this.#svg.on("click", () => {
                this.#svg.transition().duration(750).call(
                    zoom.transform,
                    d3.zoomIdentity,
                    d3.zoomTransform(this.#svg.node()).invert([this.width / 2, this.height / 2])
                );
            });
    
            g.selectAll("path")
                .data(geoData.features)
                .enter()
                .append("path")
                .attr("d", path)
                // .attr("fill", d => {
                //     const population = userData.get(d.id) || 0;
                //     const color = colorScale(population);
                //     d.originalColor = color; // Save the origin color
                //     return color;;
                // })
                .attr("fill", d => {
                    const colorValue = colorData.get(d.id) || 0;
                    const color = colorScale(colorValue);
                    d.originalColor = color;
                    return color;
                })
                .style("stroke", "transparent")
                .attr("class", "Country")
                .style("opacity", 0.8)
                .on("mouseover", mouseOver)
                .on("mouseleave", mouseLeave)
                // .on("click", clicked);
                .on("click", (event, d) => clicked(event, d));
        });
    }
}
customElements.define("map-chart", MapChart);

export { BarChart, MapChart, NodeLinkChart, PieChart };
//# sourceMappingURL=kgnovis.bundle.js.map
