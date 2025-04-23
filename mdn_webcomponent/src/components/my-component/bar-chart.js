// const scale_d3 = {'ordinal': d3.scaleOrdinal}


//function to convert rgb object to hex color
function componentToHex(c) {
	var hex = c.toString(16);
	return hex.length == 1 ? "0" + hex : hex;
}

function rgbToHex(r, g, b) {
	return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

function hexToRgb(hex) {
	// Remove the "#" character if present
	hex = hex.replace(/^#/, '');

	// Convert from short form (3 characters) to full form (6 characters)
	if (hex.length === 3) {
		hex = hex.split('').map(c => c + c).join('');
	}

	// Convert to RGB values
	let r = parseInt(hex.substring(0, 2), 16);
	let g = parseInt(hex.substring(2, 4), 16);
	let b = parseInt(hex.substring(4, 6), 16);

	return `rgb(${r}, ${g}, ${b})`;
}

// Function to truncate long labels
function truncateLabel(label, maxLength = 5) {
	return label.length > maxLength ? label.slice(0, maxLength) + "..." : label;
}

class BarChart extends HTMLElement {
	#dataValue = '';
	#coreData = null;
	#width = 400;
	#height = 400;
	#svg = null;

	constructor() {
	  super();
	  this.data = null;
	  this.margin = { top: 20, right: 40, bottom: 70, left: 38 };
	  this.attachShadow({ mode: 'open' });
	}

	static get observedAttributes() {
	  return ['data'];
	}

	connectedCallback() {
	  this.render();
	}

	attributeChangedCallback(name, oldValue, newValue) {
	  if (name === "data" && newValue != null) {
		this.#dataValue = newValue;
		this.#coreData = JSON.parse(this.#dataValue); // Parse JSON data
		this.#width = this.#coreData.width, this.#height = this.#coreData.height;
		this.removeAttribute("data");
		this.drawChart();
	  }
	}

	render() {
	  this.shadowRoot.innerHTML = `
		<style>
			:host { display: block; width: 100%; height: 100%; position: relative; }
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

			.info-popup { display: none; position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; padding: 20px; border-radius: 10px; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3); z-index: 1000; }
			.info-popup.show { display: block; }

			.color-picker-container {
				display: flex;
				flex-direction: column;
				align-items: center;
				width: 220 px;
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
				margin-bottom: 20px;
				display: block;
				width: 100%;
			}
		</style>
		<div class="main-container">
			<div class="content">
				<div class="color-picker-container">
					<div class="legend-title">Language</div>
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

	// Function to show or hide the popup
	togglePopup(show) {
	  const popup = this.shadowRoot.querySelector(".popup");
	  popup.classList.toggle("show", show);
	}


	// Function to draw Axes based on provided data
	drawAxis(data, xVariable, yVariable, isHorizontal=false, isStacked=false, isNormalized = false, scaleType, maxLabelLength=5) 
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
					.domain([1, logMax])
					.range([this.margin.left, this.#width - this.margin.right]);
			} else if (yScaleType === "pow") {
				x = d3.scalePow()
					.exponent(exponent)
					.domain([0, d3.max(data, d => +d[yVariable])])
					.range([this.margin.left, this.#width - this.margin.right]);
			} else {
				x = d3.scaleLinear()
					.domain([0, d3.max(data, d => +d[yVariable])])
					.nice()
					.range([this.margin.left, this.#width - this.margin.right]);
			}
			y = d3.scaleBand()
				.domain(data.map(d => d[xVariable]))
				.range([this.margin.top, this.#height - this.margin.bottom])
				.padding(0.1);
		} else {
			x = d3.scaleBand()
				.domain(data.map(d => d[xVariable]))
				.range([this.margin.left, this.#width - this.margin.right])
				.padding(0.3);
		
			if (yScaleType === "log") {
				const rawMax = d3.max(data, d => +d[yVariable]);
				const logMax = Math.pow(10, Math.ceil(Math.log10(rawMax)));
				y = d3.scaleLog()
					.base(10)
					.domain([1, logMax])
					.range([this.#height - this.margin.bottom, this.margin.top]);
			} else if (yScaleType === "pow") {
				y = d3.scalePow()
					.exponent(exponent)
					.domain([0, d3.max(data, d => +d[yVariable])])
					.range([this.#height - this.margin.bottom, this.margin.top]);
			} else {
				y = d3.scaleLinear()
					.domain([0, d3.max(data, d => +d[yVariable])])
					.nice()
					.range([this.#height - this.margin.bottom, this.margin.top]);
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
						.range([this.margin.left, this.#width - this.margin.right]);
				} else if (yScaleType === "pow") {
					x = d3.scalePow()
						.exponent(exponent)
						.domain([0, maxY])
						.range([this.margin.left, this.#width - this.margin.right]);
				} else {
					x = d3.scaleLinear()
						.domain([0, maxY])
						.range([this.margin.left, this.#width - this.margin.right]);
				}
				y = d3.scaleBand()
					.domain(result.map(d => d.x))
					.range([this.margin.top, this.#height - this.margin.bottom])
					.padding(0.1);
			} else {
				if (yScaleType === "log") {
					y = d3.scaleLog()
						.base(10)
						.domain([1, maxY])
						.range([this.#height - this.margin.bottom, this.margin.top]);
				} else if (yScaleType === "pow") {
					y = d3.scalePow()
						.exponent(exponent)
						.domain([0, maxY])
						.range([this.#height - this.margin.bottom, this.margin.top]);
				} else {
					y = d3.scaleLinear()
						.domain([0, maxY])
						.range([this.#height - this.margin.bottom, this.margin.top]);
				}
			}
			
		}

		// X Axis
		const xAxis = isHorizontal
		? d3.axisBottom(x).ticks(5).tickFormat(d => isNormalized ? `${Math.round(d * 100)}%` : (d < 1000000 ? d : d / 1000000 + " M"))
		: d3.axisBottom(x).tickFormat(d => d.length > maxLabelLength ? d.slice(0, maxLabelLength) + "..." : d);

		this.#svg.append("g")
			.attr("transform", `translate(0, ${this.#height - this.margin.bottom})`)
			.call(xAxis)
			.selectAll("text")
			.style("font-size", "10px");

		// Y Axis
		const yAxis = isHorizontal
			? d3.axisLeft(y).tickFormat(d => d.length > maxLabelLength ? d.slice(0, maxLabelLength) + "..." : d)
			: d3.axisLeft(y).ticks(5).tickFormat(d => isNormalized ? `${Math.round(d * 100)}%` : (d < 1000000 ? d : d / 1000000 + " M"));

		this.#svg.append("g")
			.attr("transform", `translate(${this.margin.left}, 0)`)
			.call(yAxis)
			.selectAll("text")
			.style("font-size", "10px");

		// X axis label
		this.#svg.append("text")
			.attr("class", "x-axis-label")
			.attr("x", (this.#width - this.margin.left - this.margin.right) / 2)
			.attr("y", this.#height - this.margin.bottom / 2)
			.style("text-anchor", "middle")
			.style("font-size", "18px")
			.text(isHorizontal ? yVariable : xVariable);

		// Y axis label
		this.#svg.append("text")
			.attr("class", "y-axis-label")
			.attr("x", -(this.#height - this.margin.top - this.margin.bottom) / 2)
			.attr("y", -this.margin.left + 20)
			.style("text-anchor", "middle")
			.style("font-size", "18px")
			.text(isHorizontal ? xVariable : yVariable)
			.attr("transform", "rotate(-90)");

		return [x, y];

	}

	// Draw chart
	drawChart() {
		const tooltip = this.shadowRoot.querySelector(".tooltip");
		let coreData = JSON.parse(this.#dataValue);
		let data = coreData.data[0].values;
		const svgElement = this.shadowRoot.querySelector('svg');
		d3.select(svgElement).selectAll("g").remove();
		this.#svg = d3.select(svgElement)
			.attr("width", this.#width).attr("height", this.#height).style("margin", "30px")
			.append("g")
			.attr("transform",
				 "translate(" + this.margin.left + "," + this.margin.top + ")");
	
		const isHorizontal = coreData.encoding.direction === "horizontal";
		const stackOption = coreData.encoding.stack;
		const isNormalized = stackOption === "normalize";
		const isStacked = stackOption === true || isNormalized;
		const isGrouped = stackOption === false;
		
		const scaleType = coreData.encoding.y?.scale; // Scale Type

		const xVariable = coreData.encoding.x?.field;
		const yVariable = coreData.encoding.y?.field;
	
		this.xVariable = xVariable;
		this.yVariable = yVariable;
	
		const colorVariable = coreData.encoding.color?.field;
		// let colorRange = coreData.encoding.color?.scale;
		let colorScaleObj = coreData.encoding.color?.scale;
		let colorDomain = Array.isArray(colorScaleObj?.domain) ? colorScaleObj.domain : [];
		
		let colorRange = Array.isArray(colorScaleObj?.range) ? colorScaleObj.range : colorScaleObj;
		
		this.colorRange = colorRange;


		const hasColors = data.some(d => d[colorVariable]);
		const defaultColor = "#cccccc";
		let uniqueColors = hasColors ? [...new Set(data.map(d => d[colorVariable]))] : [];
		
		let finalColors;

		// Check if colorDomain is a valid non-empty array
		const isDomainArray = Array.isArray(colorDomain) && colorDomain.length > 0;

		if (colorRange && !isStacked) {
			// Only proceed with color mapping logic if colorRange is defined and not stacked bar chart
			if (isDomainArray) {
				// Filter domain values that are actually used in the dataset
				const validDomain = colorDomain.filter(d => uniqueColors.includes(d));
				// Identify domain values that are not in the dataset
				const extraDomain = colorDomain.filter(d => !uniqueColors.includes(d));

				if (extraDomain.length > 0) {
					console.warn(
						`[Color Warning] The following domain values are not found in the dataset and will be ignored: ${extraDomain.join(', ')}.`
					);
				}

				// Find dataset values that are missing in the color domain
				const missingDomain = uniqueColors.filter(d => !validDomain.includes(d));

				if (missingDomain.length > 0) {
					console.warn(
						`[Color Warning] The color domain is missing the following values from the dataset: ${missingDomain.join(', ')}. ` +
						`These values will be appended and assigned colors from the remaining color range.`
					);
				}

				// Final domain will include both valid and missing (new) values
				const finalDomain = [...validDomain, ...missingDomain];

				// Warn if the number of colors is less than or more than domain values
				if (colorRange.length < finalDomain.length) {
					console.warn(
						`[Color Warning] Color range size (${colorRange.length}) is smaller than the number of domain values (${finalDomain.length}). ` +
						`Colors will repeat in a cyclic manner.`
					);
				} else if (colorRange.length > finalDomain.length) {
					console.warn(
						`[Color Warning] Color range size (${colorRange.length}) is larger than the number of domain values (${finalDomain.length}). ` +
						`Extra colors will be ignored.`
					);
				}

				// Safely assign finalColors using the colorRange or fallback to Turbo if colorRange is invalid
				if (Array.isArray(colorRange) && colorRange.length > 0) {
					finalColors = finalDomain.map((_, i) => colorRange[i % colorRange.length]);
				} else {
					console.warn("[Color Warning] Color range is empty or invalid. Using default Turbo colors.");
					finalColors = d3.quantize(t => d3.interpolateTurbo(t * 0.8 + 0.1), finalDomain.length);
				}

				// Create a color scale with the computed domain and range
				this.colorScale = d3.scaleOrdinal()
					.domain(finalDomain)
					.range(finalColors);
			} else {
				// If the domain is not a valid array, fallback to using dataset values as domain
				console.warn(
					"[Color Warning] Provided color domain is empty or invalid. Using color range with dataset values."
				);

				if (Array.isArray(colorRange) && colorRange.length > 0) {
					finalColors = uniqueColors.map((_, i) => colorRange[i % colorRange.length]);
				} else {
					console.warn("[Color Warning] Color range is empty or invalid. Using default Turbo colors.");
					finalColors = d3.quantize(t => d3.interpolateTurbo(t * 0.8 + 0.1), uniqueColors.length);
				}

				this.colorScale = d3.scaleOrdinal()
					.domain(uniqueColors)
					.range(finalColors);
			}
		} else {
			// ❗ Fallback when colorRange is not defined or when chart is stacked
			// If domain is provided but colorRange is missing, we ignore the domain
			if (!colorRange && isDomainArray) {
				console.warn(
					"[Color Warning] Color domain is provided but no color range is defined. The domain will be ignored and default colors will be used."
				);
			}

			// Use default Turbo interpolation for color mapping
			finalColors = d3.quantize(t => d3.interpolateTurbo(t * 0.8 + 0.1), uniqueColors.length);

			this.colorScale = d3.scaleOrdinal()
				.domain(uniqueColors)
				.range(finalColors);
		}




		if (isStacked) {
			data = this.fillMissingStackData(data, coreData, xVariable, yVariable);
		}
	
		const [x, y] = this.drawAxis(data, xVariable, yVariable, isHorizontal, isStacked, isNormalized, scaleType);
		

		if (isStacked && isNormalized) {
			this.drawNormalizedStackedChart(data, coreData, x, y, xVariable, yVariable, isHorizontal, tooltip);
		} else if (isStacked) {
			this.drawStackedChart(data, coreData, x, y, xVariable, yVariable, isHorizontal, tooltip);
		} else if (isGrouped) {
			this.drawGroupedChart(data, coreData, x, y, xVariable, yVariable, colorVariable, colorRange, isHorizontal, hasColors, defaultColor, tooltip);
		} else {
			this.drawRegularChart(data, x, y, xVariable, yVariable, isHorizontal, colorVariable, hasColors, defaultColor, tooltip);
		}
	
		// Color picker & legend
		if (hasColors && !isStacked) {
			this.renderColorPickers(uniqueColors);
			this.shadowRoot.querySelector(".color-picker-container").style.display = "flex";
		} else if (isStacked) {
			this.shadowRoot.querySelector(".color-picker-container").style.display = "flex";
		} else {
			this.shadowRoot.querySelector(".color-picker-container").style.display = "none";
		}
	
		this.shadowRoot.querySelector(".description").textContent = coreData.description;
	
		const legendDescription = this.shadowRoot.querySelector(".legend-title");
		legendDescription.textContent = coreData.encoding.color?.title
	}

	fillMissingStackData(data, coreData, xVariable, yVariable) {
		const stackVariable = coreData.encoding.color?.field;
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
	fillMissingGroupedData(data, xVariable, yVariable, colorVariable) {
		const groupedData = d3.group(data, d => d[xVariable]);
		const completeData = [];
	
		for (const [xVal, entries] of groupedData.entries()) {
			const validGroups = entries.filter(d => d[yVariable] !== 0);
			if (validGroups.length > 0) {
				completeData.push(...validGroups);
			}
		}
		return completeData;
	}
	

	drawStackedChart(data, coreData, x, y, xVariable, yVariable, isHorizontal, tooltip) {
		// const stackVariable = coreData.encoding.color?.field;
		// const stackKeys = [...new Set(data.map(d => d[stackVariable]))];
		// // const stackRange = coreData.encoding.color?.scale;
		// const colorScaleObj = coreData.encoding.color?.scale;
		// const stackDomain = Array.isArray(colorScaleObj?.domain) ? colorScaleObj.domain : null;
		// const stackRange = Array.isArray(colorScaleObj?.range) ? colorScaleObj.range : null;


		// const stack = d3.stack()
		// 	.keys(d3.union(data.map(d => d[stackVariable])))
		// 	.value(([, d], key) => d.get(key)[yVariable])
		// 	(d3.index(data, d => d[xVariable], d => d[stackVariable]));

		// 	function getSafeColors(domain, colorRange, defaultColors) {
		// 		if (!colorRange || colorRange.length === 0) {
		// 		  return defaultColors || d3.schemeCategory10;
		// 		}
		// 		if (colorRange.length < domain.length) {
		// 		  console.warn(`Color range (${colorRange.length}) is fewer than domain (${domain.length}). Colors will repeat.`);
		// 		  return domain.map((_, i) => colorRange[i % colorRange.length]);
		// 		}
		// 		if (colorRange.length > domain.length) {
		// 		  console.warn(`Color range (${colorRange.length}) is more than domain (${domain.length}). Extra colors will be ignored.`);
		// 		  return colorRange.slice(0, domain.length);
		// 		}
		// 		return colorRange;
		// 	  }

		// 	const stackColorScale = d3.scaleOrdinal()
		// 		.domain(stackDomain || stackKeys)
		// 		.range(getSafeColors(stackDomain || stackKeys, stackRange, d3.schemeCategory10)
		// 	);
		
		const stackVariable = coreData.encoding.color?.field;
		const stackKeys = [...new Set(data.map(d => d[stackVariable]))];
		const colorScaleObj = coreData.encoding.color?.scale;
		const stackDomain = Array.isArray(colorScaleObj?.domain) ? colorScaleObj.domain : [];
		const stackRange = Array.isArray(colorScaleObj?.range) ? colorScaleObj.range : colorScaleObj;

		const stack = d3.stack()
			.keys(d3.union(data.map(d => d[stackVariable])))
			.value(([, d], key) => d.get(key)[yVariable])
			(d3.index(data, d => d[xVariable], d => d[stackVariable]));

		let finalStackColors;
		const isStackDomainArray = Array.isArray(stackDomain) && stackDomain.length > 0;

		if (stackRange) {
			if (isStackDomainArray) {
				const validDomain = stackDomain.filter(d => stackKeys.includes(d));
				const extraDomain = stackDomain.filter(d => !stackKeys.includes(d));
				const missingDomain = stackKeys.filter(d => !validDomain.includes(d));

				if (extraDomain.length > 0) {
					console.warn(
						`[StackColor Warning] The following domain values are not found in the dataset and will be ignored: ${extraDomain.join(', ')}.`
					);
				}
				if (missingDomain.length > 0) {
					console.warn(
						`[StackColor Warning] The domain is missing values from the dataset: ${missingDomain.join(', ')}. ` +
						`These values will be appended and assigned colors from the remaining color range.`
					);
				}

				const finalDomain = [...validDomain, ...missingDomain];

				if (stackRange.length < finalDomain.length) {
					console.warn(
						`[StackColor Warning] Color range size (${stackRange.length}) is smaller than domain size (${finalDomain.length}). Colors will repeat.`
					);
				} else if (stackRange.length > finalDomain.length) {
					console.warn(
						`[StackColor Warning] Color range size (${stackRange.length}) is larger than domain size (${finalDomain.length}). Extra colors will be ignored.`
					);
				}

				finalStackColors = Array.isArray(stackRange) && stackRange.length > 0
					? finalDomain.map((_, i) => stackRange[i % stackRange.length])
					: d3.quantize(t => d3.interpolateTurbo(t * 0.8 + 0.1), finalDomain.length);

				this.stackColorScale = d3.scaleOrdinal()
					.domain(finalDomain)
					.range(finalStackColors);
			} else {
				console.warn("[StackColor Warning] Provided domain is invalid. Using dataset values as domain.");
				finalStackColors = Array.isArray(stackRange) && stackRange.length > 0
					? stackKeys.map((_, i) => stackRange[i % stackRange.length])
					: d3.quantize(t => d3.interpolateTurbo(t * 0.8 + 0.1), stackKeys.length);

				this.stackColorScale = d3.scaleOrdinal()
					.domain(stackKeys)
					.range(finalStackColors);
			}
		} else {
			console.warn("[StackColor Warning] No color range provided. Using default Turbo colors.");
			finalStackColors = d3.quantize(t => d3.interpolateTurbo(t * 0.8 + 0.1), stackKeys.length);

			this.stackColorScale = d3.scaleOrdinal()
				.domain(stackKeys)
				.range(finalStackColors);
		}

		
		this.renderStackLegend(stackKeys, this.stackColorScale);
	
		const bars = this.#svg.append("g")
			.selectAll("g")
			.data(stack)
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
			})
			.on("mousemove", (event) => {
				tooltip.style.left = (d3.pointer(event)[0] + this.#width / 2 + 120) + "px";
				tooltip.style.top = (d3.pointer(event)[1] + this.#height / 3 - 50) + "px";
			})
			.on("mouseleave", (event) => {
				tooltip.style.opacity = 0;
				d3.select(event.target).style("stroke", "none").style("opacity", 1);
			});
	}
	
	drawNormalizedStackedChart(data, coreData, x, y, xVariable, yVariable, isHorizontal, tooltip) {
		const stackVariable = coreData.encoding.color?.field;
		const stackKeys = [...new Set(data.map(d => d[stackVariable]))];
		const colorScaleObj = coreData.encoding.color?.scale;
		const stackDomain = Array.isArray(colorScaleObj?.domain) ? colorScaleObj.domain : null;
		const stackRange = Array.isArray(colorScaleObj?.range) ? colorScaleObj.range : null;

		// Normalize the data -> sum of each group must be 100!
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
		
		
		// Stack the data
		const stackedData = d3.stack()
			.keys(stackKeys)
			.value(([, d], key) => d.get(key)?.[yVariable] || 0)
			(d3.index(normalizedData, d => d[xVariable], d => d[stackVariable]));

		// const colorRange = coreData.encoding.color?.scale;
		function getSafeColors(domain, colorRange, defaultColors) {
			if (!colorRange || colorRange.length === 0) {
			  return defaultColors || d3.schemeCategory10;
			}
			if (colorRange.length < domain.length) {
			  console.warn(`Color range (${colorRange.length}) is fewer than domain (${domain.length}). Colors will repeat.`);
			  return domain.map((_, i) => colorRange[i % colorRange.length]);
			}
			if (colorRange.length > domain.length) {
			  console.warn(`Color range (${colorRange.length}) is more than domain (${domain.length}). Extra colors will be ignored.`);
			  return colorRange.slice(0, domain.length);
			}
			return colorRange;
		  }
		const stackColorScale = d3.scaleOrdinal()
			.domain(stackDomain || stackKeys)
			.range(getSafeColors(stackDomain || stackKeys, stackRange, d3.schemeCategory10));
	
		this.renderStackLegend(stackKeys, stackColorScale);
	
		const bars = this.#svg.append("g")
			.selectAll("g")
			.data(stackedData)
			.join("g")
			.attr("fill", d => stackColorScale(d.key));
	
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
			})
			.on("mousemove", (event) => {
				tooltip.style.left = (d3.pointer(event)[0] + this.#width / 2 + 120) + "px";
				tooltip.style.top = (d3.pointer(event)[1] + this.#height / 3 - 50) + "px";
			})
			.on("mouseleave", (event) => {
				tooltip.style.opacity = 0;
				d3.select(event.target).style("stroke", "none").style("opacity", 1);
			});
	}
	
	
	// drawGroupedChart(data, coreData, x, y, xVariable, yVariable, colorVariable, colorRange, isHorizontal, hasColors, defaultColor, tooltip) {
	// 	const groupVariable = coreData.encoding.color?.field;
	// 	const subgroups = [...new Set(data.map(d => d[groupVariable]))];
	// 	const groups = [...new Set(data.map(d => d[xVariable]))];
		

	// 	// Create scale for main group (x0, y0)
	// 	const x0 = isHorizontal ? null : d3.scaleBand()
	// 		.domain(groups)
	// 		.range([this.margin.left, this.#width - this.margin.right])
	// 		.padding(0.2);
	
	// 	const y0 = isHorizontal ? d3.scaleBand()
	// 		.domain(groups)
	// 		.range([this.margin.top, this.#height - this.margin.bottom])
	// 		.padding(0.2) : null;
	
	// 	// Create scale for subgroups
	// 	const subgroupScale = d3.scaleBand()
	// 		.domain(subgroups)
	// 		.range(isHorizontal ? [0, y0.bandwidth()] : [0, x0.bandwidth()])
	// 		.padding(0.05);
	
	// 	// Group data by main group
	// 	const groupedData = d3.groups(data, d => d[xVariable]);

	// 	this.#svg.append("g")
	// 		.selectAll("g")
	// 		.data(groupedData)
	// 		.join("g")
	// 		.attr("transform", ([group]) =>
	// 			isHorizontal
	// 				? `translate(0, ${y0(group)})`
	// 				: `translate(${x0(group)}, 0)`
	// 		)
	// 		.selectAll("rect")
	// 		.data(([, values]) => {
	// 			return values;
	// 		})
	// 		.join("rect")
	// 		.attr("x", isHorizontal ? x(0) : d => subgroupScale(d[groupVariable]))
	// 		.attr("y", isHorizontal ? d => subgroupScale(d[groupVariable]) : d => y(d[yVariable]))
	// 		.attr("height", isHorizontal ? subgroupScale.bandwidth() : d => y(0) - y(d[yVariable]))
	// 		.attr("width", isHorizontal ? d => x(d[yVariable]) - x(0) : subgroupScale.bandwidth())
	// 		.attr("fill", d => hasColors ? this.colorScale(d[colorVariable]) : defaultColor)
	// 		.on("mouseover", (event, d) => {
	// 			tooltip.style.opacity = 1;
	// 			tooltip.innerHTML = `${xVariable}: ${d[xVariable]}<br>${groupVariable}: ${d[groupVariable]}<br>${yVariable}: ${d[yVariable]}`;
	// 			d3.select(event.target).style("stroke", "black").style("opacity", 1);
	// 		})
	// 		.on("mousemove", (event) => {
	// 			tooltip.style.left = (d3.pointer(event)[0] + this.#width / 2 + 120) + "px";
	// 			tooltip.style.top = (d3.pointer(event)[1] + this.#height / 3 - 50) + "px";
	// 		})
	// 		.on("mouseleave", (event) => {
	// 			tooltip.style.opacity = 0;
	// 			d3.select(event.target).style("stroke", "none").style("opacity", 1);
	// 		});
	// }
	drawGroupedChart(data, coreData, x, y, xVariable, yVariable, colorVariable, colorRange, isHorizontal, hasColors, defaultColor, tooltip) {
		const groupVariable = coreData.encoding.color?.field;
		const groups = [...new Set(data.map(d => d[xVariable]))];
	
		// Create scale for main group
		const x0 = isHorizontal ? null : d3.scaleBand()
			.domain(groups)
			.range([this.margin.left, this.#width - this.margin.right])
			.padding(0.2);
	
		const y0 = isHorizontal ? d3.scaleBand()
			.domain(groups)
			.range([this.margin.top, this.#height - this.margin.bottom])
			.padding(0.2) : null;
	
		// Group data by main group
		const groupedData = d3.groups(data, d => d[xVariable]);
	
		const group = this.#svg.append("g")
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
	
			// Create local scale for subgroup
			const localSubgroupScale = d3.scaleBand()
				.domain(localSubgroups)
				.range(isHorizontal ? [0, y0.bandwidth()] : [0, x0.bandwidth()])
				.padding(0.05);
	
			g.selectAll("rect")
				.data(values)
				.join("rect")
				.attr("x", d => isHorizontal ? x(0) : localSubgroupScale(d[groupVariable]))
				.attr("y", d => isHorizontal ? localSubgroupScale(d[groupVariable]) : y(d[yVariable]))
				.attr("width", d => isHorizontal ? x(d[yVariable]) - x(0) : localSubgroupScale.bandwidth())
				.attr("height", d => isHorizontal ? localSubgroupScale.bandwidth() : y(0) - y(d[yVariable]))
				.attr("fill", d => hasColors ? this.colorScale(d[colorVariable]) : defaultColor)
				.on("mouseover", (event, d) => {
					tooltip.style.opacity = 1;
					tooltip.innerHTML = `${xVariable}: ${d[xVariable]}<br>${groupVariable}: ${d[groupVariable]}<br>${yVariable}: ${d[yVariable]}`;
					d3.select(event.target).style("stroke", "black").style("opacity", 1);
				})
				.on("mousemove", (event) => {
					tooltip.style.left = (d3.pointer(event)[0] + this.#width / 2 + 120) + "px";
					tooltip.style.top = (d3.pointer(event)[1] + this.#height / 3 - 50) + "px";
				})
				.on("mouseleave", (event) => {
					tooltip.style.opacity = 0;
					d3.select(event.target).style("stroke", "none").style("opacity", 1);
				});
		});
	}
	

	drawRegularChart(data, x, y, xVariable, yVariable, isHorizontal, colorVariable, hasColors, defaultColor, tooltip) {
		this.#svg.append("g")
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
			.attr("fill", d => hasColors ? this.colorScale(d[colorVariable]) : defaultColor)
			// Tooltip mouse events
			.on("mouseover", (event, d) => {
				tooltip.style.opacity = 1;
				tooltip.innerHTML = `${xVariable}: ${d[xVariable]}<br>${yVariable}: ${d[yVariable]}`;
				d3.select(event.target).style("stroke", "black").style("opacity", 1);
			})
			.on("mousemove", (event) => {
				tooltip.style.left = (d3.pointer(event)[0] + this.#width / 2 + 120) + "px";
                tooltip.style.top = (d3.pointer(event)[1] + this.#height / 3 - 50) + "px";
			})
			.on("mouseleave", (event) => {
				tooltip.style.opacity = 0;
				d3.select(event.target).style("stroke", "none").style("opacity", 1);
			});
	}
	

	// Show information popup with data details when a bar is clicked
	showInfoPopup(d) {
		const infoPopup = this.shadowRoot.querySelector(".info-popup");
		infoPopup.innerHTML = `
			<div>Tag: ${d[this.xVariable]}</div>
			<div>Value: ${d[this.yVariable]}</div>
			<button class="close-popup">Close</button>
		`;
		infoPopup.classList.add("show");
		this.shadowRoot.querySelector(".close-popup").addEventListener("click", () => infoPopup.classList.remove("show"));
	}

	// Render color pickers for each bar based on data
	renderColorPickers(uniqueColors) {
		let coreData = JSON.parse(this.#dataValue);
		const container = this.shadowRoot.querySelector(".color-picker-container");
		const colorVariable = coreData.encoding.color?.field;
		container.style.display = "block"; // Ensure the color picker container is visible
		uniqueColors.forEach((d, index) => {
			const colorItem = document.createElement("div");
			colorItem.classList.add("color-item");

			const label = document.createElement("label");
			label.textContent = d; // Set the text label to the unique language name

			console.log("AAAAAA", this.colorScale(d))
			console.log("colorScale domain:", this.colorScale.domain());
			console.log("value d:", d);
			console.log("colorScale range:", this.colorScale.range());


			const input = document.createElement("input");
			input.type = "color"; // Create a color input element
			input.value = d3.color(this.colorScale(d)).formatHex(); // Set the initial color from the color scale
			input.setAttribute("data-index", index); // Store index data for reference

			colorItem.appendChild(label); // Append to color item container
			colorItem.appendChild(input);
			container.appendChild(colorItem);

			// Add event listener to handle color changes
			input.addEventListener("input", (event) => this.updateColor(event, coreData, colorVariable, d));
		});
	}
	
	renderStackLegend(stackKeys, stackColorScale) {
		const container = this.shadowRoot.querySelector(".color-picker-container");
		container.innerHTML = '<div class="legend-title">Stack Legend</div>';
	
		stackKeys.forEach((key, index) => {
			const colorItem = document.createElement("div");
			colorItem.classList.add("color-item");
	
			const label = document.createElement("label");
			label.textContent = key;
	
			const input = document.createElement("input");
			input.type = "color";
			input.value = d3.color(stackColorScale(key)).formatHex();
			input.setAttribute("data-key", key);
	
			colorItem.appendChild(label);
			colorItem.appendChild(input);
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
		this.#svg.selectAll("g") // Find all group (g) of stacked bars
			.filter(d => d && d.key === key) // Filter to key of stack
			.selectAll("rect") // Choose all rect in that group
			.transition()
			.duration(300)
			.attr("fill", newColor);
	
		// Update data color to dataset
		let data = JSON.parse(this.#dataValue); // Get current data
		// data.forEach(d => {
		// 	if (d[stackVariable] === key) { // Match the stack variable to key
		// 		d.color = newColor;
		// 	}
		// });
	
		// Save data after updating
		this.#dataValue = JSON.stringify(data); // Update data
	}
	

	// Add event listeners to update color
	updateColor(event, coreData, colorVariable, label) {

		let data = coreData.data[0].values
		let listColorCriteria = data.map(d => d[colorVariable]) // Get list of color-related data attributes
		const indexs = getAllIndexes(listColorCriteria, label); // Find all indexes of the current label
		for (const index of indexs) {
		  const newColor = event.target.value; // Get the new color selected by the user
		  data[index].color = newColor; // Update color in dataset
		  const rect = this.shadowRoot.querySelectorAll("rect")[index]; // Get the corresponding pie chart segment
		  d3.select(rect)
			.transition()
			.duration(300)
			.attr("fill", newColor);
		}
		this.#dataValue = JSON.stringify(data); // Update data
	}

	// Getter
	get dataValue() {
	  return this.#dataValue;
	}

	// Setter
	set dataValue(data) {
	  this.#dataValue = data;
	}
  }

  customElements.define('bar-chart', BarChart);
