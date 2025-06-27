// import * as d3 from 'd3';
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

import {
	createColorScale,
	getAllIndexes
} from './utilities/color-utils.js';

import {
	dataParser,
	encodingParser,
} from './utilities/utilities.js';

export default class BarChart extends HTMLElement {
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
			const grouped = data.reduce((res, value) => {
				if (!res[value[xVariable]]) {
					res[value[xVariable]] = { x: value[xVariable], y: 0 };
					result.push(res[value[xVariable]]);
				}
				res[value[xVariable]].y += value[yVariable] ? parseInt(value[yVariable]) : 0;
				return res;
			}, {});
	
			let maxY = d3.max(result, d => d.y)
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
			console.error(`Enter required x or y in the configuration.`)
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
		};
	}

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
		const inputSize = Math.max(10, this.legendHeight * 0.05)
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
		const inputSize = Math.max(10, this.legendHeight * 0.05)
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
		let listColorCriteria = this.#data.map(d => d[colorVariable]) // Get list of color-related data attributes
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
