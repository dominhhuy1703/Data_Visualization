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
	drawAxis(data, xVariable, yVariable, isHorizontal=false, isStacked=false, maxLabelLength=5) 
	{
		// Define scales based on direction
		let x, y;
		if (isHorizontal) {
			// For horizontal bar chart: x is linear (value), y is categorical
			x = d3.scaleLinear()
				.domain([0, d3.max(data, d => parseInt(d[yVariable]))])
				.range([this.margin.left, this.#width - this.margin.right]);

			y = d3.scaleBand()
				.domain(data.map(d => d[xVariable]))
				.range([this.margin.top, this.#height - this.margin.bottom])
				.padding(0.1);
		} else {
			// For vertical bar chart: x is categorical, y is linear (value)
			x = d3.scaleBand()
				.domain(data.map(d => d[xVariable]))
				.range([this.margin.left, this.#width - this.margin.right])
				.padding(0.3);
			y = d3.scaleLinear()
				.domain([0, d3.max(data, d => parseInt(d[yVariable]))])
				.nice()
				.range([this.#height - this.margin.bottom, this.margin.top]);
		}
		if (isStacked) {
			// Prepare aggregated data for stacked chart
			let result = [];			
			data.reduce(function(res, value) {
				if (!res[value[xVariable]]) {
					res[value[xVariable]] = { x: value[xVariable], y: 0 };
					result.push(res[value[xVariable]])
				}
				res[value[xVariable]].y += value[yVariable] ? parseInt(value[yVariable]) : 0;
				return res;
				}, {});
			if (isHorizontal) {
				// Horizontal stacked scale
				x = d3.scaleLinear()
					.domain([0, d3.max(result, d => d.y)])
					.range([this.margin.left, this.#width - this.margin.right])
				y = d3.scaleBand()
					.domain(result.map(d => d.x))
					.range([this.margin.top, this.#height - this.margin.bottom])
					.padding(0.1);

			} else {
				// Vertical stacked scale
				y = d3.scaleLinear()
					.domain([0, d3.max(result, d => d.y)])
					.range([this.#height - this.margin.bottom, this.margin.top])
			}
		}

		// Configure X Axis with custom tick formatting
		const xAxis = isHorizontal ? d3.axisBottom(x).tickFormat(function(d){return d < 1000000 ? d : d/1000000 +"  M"}) : d3.axisBottom(x).tickFormat(function(d){return d.length > maxLabelLength ? d.slice(0, maxLabelLength) + "..." : d});
		// Append axes to the SVG
		this.#svg.append("g")
			.attr("transform", `translate(0, ${this.#height - this.margin.bottom})`)
			.call(xAxis)
			.selectAll("text")
			.style("font-size", "10px")
			// .text(d => truncateLabel(d))
		
		// Configure Y Axis with custom tick formatting
		var yAxis = isHorizontal ? d3.axisLeft(y).tickFormat(function(d) { return d.length > maxLabelLength ? d.slice(0, maxLabelLength) + "..." : d}) : d3.axisLeft(y).tickFormat(function(d){return d < 1000000 ? d : d/1000000  + "  M"});

		this.#svg.append("g")
			.attr("transform", `translate(${this.margin.left}, 0)`)
			.call(yAxis)
			.selectAll("text")
			.style("font-size", "10px")
			// .text(d => truncateLabel(d))
		
		// Add X axis title
		this.#svg.append("text")
			.attr("class", "x-axis-label")
			.attr("x", (this.#width - this.margin.left - this.margin.right) / 2)
			.attr("y", this.#height - this.margin.bottom / 2)
			.style("text-anchor", "middle")
			.style("font-size", "18px")
			.text(isHorizontal ? yVariable : xVariable);

		// Add Y axis title
		this.#svg.append("text")
			.attr("class", "y-axis-label")
			.attr("x", -(this.#height - this.margin.top - this.margin.bottom) / 2 )
			.attr("y", -this.margin.left + 20)
			.style("text-anchor", "middle")
			.style("font-size", "18px")
			.text(isHorizontal ? xVariable : yVariable)
			.attr("transform", "rotate(-90)");

		// return [this.#svg, x, y];
		return [x, y];

	}

	// // Draw chart
	// drawChart() {
	// 	const tooltip = this.shadowRoot.querySelector(".tooltip");
	// 	let coreData = JSON.parse(this.#dataValue); // Parse JSON data
	// 	let data = coreData.data[0].values; // Extract values
	// 	const svgElement = this.shadowRoot.querySelector('svg');
	// 	d3.select(svgElement).selectAll("g").remove(); // Clear previous drawings

	// 	// Get the direction (default is vertical)
	// 	const isHorizontal = coreData.direction === "horizontal";

	// 	// Add the stacked option
	// 	const isStacked = coreData.stack === "true"; // Check if stacked is true, otherwise default to false

	// 	// Add the variable to define grouped bar chart
	// 	const isGrouped = coreData.encoding.find(element => element.xOffset)?.xOffset.field;
	// 	console.log("isGrouped:", isGrouped)
	// 	// Get attributes
	// 	const xVariable = coreData.encoding.find(element => element.x)?.x.field;
	// 	const yVariable = coreData.encoding.find(element => element.y)?.y.field;
	// 	const xVariableType = coreData.encoding.find(element => element.x)?.x.type;
	// 	const yVariableType = coreData.encoding.find(element => element.y)?.y.type;

	// 	this.xVariable = xVariable;
	// 	this.yVariable = yVariable;

		
	// 	// Create stackVariable
	// 	const stackVariable = coreData.encoding.find(element => element.color)?.color.field;

	// 	// Set up color scale
	// 	const colorVariable = coreData.encoding.find(element => element.colors)?.colors.field;
	// 	console.log("ColorVarialbe:", colorVariable)
	// 	const colorRange = coreData.encoding.find(element => element.colors)?.colors.scale;
	// 	console.log("ColorRange:", colorRange)
	// 	console.log("Data:", data);

	// 	const hasColors = data.some(d => d[colorVariable]);

	// 	const defaultColor = "#cccccc";

	// 	// Create uniqueColors from data
	// 	let uniqueColors = hasColors ? [...new Set(data.map(d => d[colorVariable]))] : [];
	// 	// Check if colorRange is presented, use it, else, use d3.quantize
	// 	const colorScale = d3.scaleOrdinal()
	// 		.domain(uniqueColors)
	// 		.range(colorRange && colorRange.length === uniqueColors.length
	// 			? colorRange
	// 			: d3.quantize(t => d3.interpolateTurbo(t * 0.8 + 0.1), uniqueColors.length)
	// 		);

	// 	// Attach colorScale to class in order to use it later
	// 	this.colorScale = colorScale;

	// 	console.log("Color Scale Domain:", this.colorScale.domain());
	// 	console.log("Color Scale Range:", this.colorScale.range());

		
	// 	// Data processing
	// 	// Add missing data to ensure no errors when drawing stacked chart
	// 	if (isStacked && stackVariable) {
	// 		{
	// 			const xKeys = [...new Set(data.map(d => d[xVariable]))];
	// 			const stackKeys = [...new Set(data.map(d => d[stackVariable]))];

	// 			let completeData = [];
	// 			xKeys.forEach(xKey => {
	// 				stackKeys.forEach(stackKey => {
	// 					let existingData = data.find(d => d[xVariable] === xKey && d[stackVariable] === stackKey);
	// 					if (existingData) {
	// 						completeData.push(existingData);
	// 					} else {
	// 						completeData.push({ [xVariable]: xKey, [stackVariable]: stackKey, [yVariable]: 0 });
	// 					}
	// 				});
	// 			});

	// 			data = completeData; // Update data again
	// 		}
	// 	}

	// 	// const [svg, x, y] = this.drawAxis(data, xVariable, yVariable, isHorizontal, isStacked);
	// 	const [svg, x, y] = this.drawAxis(data, xVariable, yVariable, isHorizontal, isStacked);

	// 	// If stack
	// 	if (isStacked && stackVariable) {
	// 		const stackKeys = [...new Set(data.map(d => d[stackVariable]))];

	// 		const stackRange = coreData.encoding.find(element => element.color)?.color.scale;
	// 		console.log("StackRange:", stackRange)
	// 		const stackColorScale = d3.scaleOrdinal()
	// 			.domain(stackKeys)
	// 			.range(stackRange && stackRange.length === stackKeys.length ? stackRange : d3.schemeCategory10);

	// 		console.log("Stack Color Scale Domain:", stackColorScale.domain());
	// 		console.log("Stack Color Scale Range:", stackColorScale.range());

	// 		const stack = d3.stack()
	// 			.keys(d3.union(data.map(d => d[stackVariable])))
	// 			.value(([, d], key) => d.get(key)[yVariable])
	// 			(d3.index(data, d => d[xVariable], d => d[stackVariable]));
			
	// 		// Call renderStackLegend after stackKeys and stackColorScale created
	// 		this.renderStackLegend(stackKeys, stackColorScale);

	// 		if (isHorizontal)
	// 		{	
	// 			svg.append("g")
	// 				.selectAll("g")
	// 				.data(stack)
	// 				.join("g")
	// 				.attr("fill", d => stackColorScale(d.key))
	// 				.selectAll("rect")
	// 				.data(D => D)
	// 				.join("rect")
	// 				.attr("x", d =>  x(d[0]))
	// 				.attr("y", d => y(d.data[0]))
	// 				.attr("height", y.bandwidth())
	// 				.attr("width", d => x(d[1]) - x(d[0]))
	// 		} else 
	// 		{	
	// 			svg.append("g")
	// 				.selectAll("g")
	// 				.data(stack)
	// 				.join("g")
	// 				.attr("fill", d => stackColorScale(d.key))
	// 				.selectAll("rect")
	// 				.data(D => D)
	// 				.join("rect")
	// 				.attr("x", d => x(d.data[0]))
	// 				.attr("y", d => y(d[1]))
	// 				.attr("height", d => y(d[0]) - y(d[1]))
	// 				.attr("width", x.bandwidth())

	// 		}
		
	// 	// Grouped bar chart
	// 	} else if (isGrouped) {
			
	// 		// Get the subgroups
	// 		const subgroups = [...new Set(data.map(d => d[isGrouped]))];

	// 		const groupColorScale = d3.scaleOrdinal()
	// 			.domain(subgroups)
	// 			.range(colorRange && colorRange.length === subgroups.length ? colorRange : d3.schemeCategory10);

	// 		if (isHorizontal) {
	// 			// scaleBand cho nhóm trong mỗi hàng
	// 			const ySubgroup = d3.scaleBand()
	// 				.domain(subgroups)
	// 				.range([0, y.bandwidth()])
	// 				.padding(0.05);

	// 			svg.append("g")
	// 				.selectAll("g")
	// 				.data(data)
	// 				.join("g")
	// 				.attr("transform", d => `translate(0, ${y(d[xVariable])})`)
	// 				.selectAll("rect")
	// 				.data(d => [d])
	// 				.join("rect")
	// 				.attr("x", x(0))
	// 				.attr("y", d => ySubgroup(d[isGrouped]))
	// 				.attr("height", ySubgroup.bandwidth())
	// 				.attr("width", d => x(d[yVariable]) - x(0))
	// 				.attr("fill", d => groupColorScale(d[isGrouped]))
	// 				.on("mouseover", (event, d) => {
	// 					tooltip.style.opacity = 1;
	// 					tooltip.innerHTML = `<strong>${d[xVariable]} - ${d[isGrouped]}</strong>: ${d[yVariable]}`;
	// 					d3.select(event.target).style("stroke", "black").style("opacity", 1);
	// 				})
	// 				.on("mousemove", (event) => {
	// 					tooltip.style.left = (event.pageX + 10) + "px";
	// 					tooltip.style.top = (event.pageY - 20) + "px";
	// 				})
	// 				.on("mouseout", (event) => {
	// 					tooltip.style.opacity = 0;
	// 					d3.select(event.target).style("stroke", "none").style("opacity", 1);
	// 				});
	// 		} else {
	// 			// scaleBand cho nhóm trong mỗi cột
	// 			const xSubgroup = d3.scaleBand()
	// 				.domain(subgroups)
	// 				.range([0, x.bandwidth()])
	// 				.padding(0.05);

	// 			svg.append("g")
	// 				.selectAll("g")
	// 				.data(data)
	// 				.join("g")
	// 				.attr("transform", d => `translate(${x(d[xVariable])}, 0)`)
	// 				.selectAll("rect")
	// 				.data(d => [d])
	// 				.join("rect")
	// 				.attr("x", d => xSubgroup(d[isGrouped]))
	// 				.attr("y", d => y(d[yVariable]))
	// 				.attr("width", xSubgroup.bandwidth())
	// 				.attr("height", d => y(0) - y(d[yVariable]))
	// 				.attr("fill", d => groupColorScale(d[isGrouped]))
	// 				.on("mouseover", (event, d) => {
	// 					tooltip.style.opacity = 1;
	// 					tooltip.innerHTML = `<strong>${d[xVariable]} - ${d[isGrouped]}</strong>: ${d[yVariable]}`;
	// 					d3.select(event.target).style("stroke", "black").style("opacity", 1);
	// 				})
	// 				.on("mousemove", (event) => {
	// 					tooltip.style.left = (event.pageX + 10) + "px";
	// 					tooltip.style.top = (event.pageY - 20) + "px";
	// 				})
	// 				.on("mouseout", (event) => {
	// 					tooltip.style.opacity = 0;
	// 					d3.select(event.target).style("stroke", "none").style("opacity", 1);
	// 				});
	// 		}
			
	// 	} else {
    //     this.bars = svg.selectAll("rect")
    //         .data(data)
    //         .join("rect")
    //         .attr(isHorizontal ? "x" : "y", d => isHorizontal ? x(0) + 0.5 : y(d[yVariable]))
    //         .attr(isHorizontal ? "y" : "x", d => isHorizontal ? y(d[xVariable]) :  x(d[xVariable]))
    //         .attr(isHorizontal ? "width" : "height", d => isHorizontal ? x(d[yVariable]) - x(0) : y(0) - y(d[yVariable]))
    //         .attr(isHorizontal ? "height" : "width", isHorizontal ? y.bandwidth() : x.bandwidth())
    //         .attr("fill", d => hasColors ? this.colorScale(d[colorVariable]) : defaultColor)
    //         .on("click", (event, d) => this.showInfoPopup(d))
    //         .on("mouseover", (event, d) => {
    //             tooltip.style.opacity = 1;
    //             tooltip.innerHTML = `<strong>${d[xVariable]}</strong>: ${d[yVariable]}`;
    //             d3.select(event.target).style("stroke", "black").style("opacity", 1);
    //         })
    //         .on("mousemove", (event) => {
    //             tooltip.style.left = (d3.pointer(event)[0] + this.#width / 2 + 120) + "px";
    //             tooltip.style.top = (d3.pointer(event)[1] + this.#height / 3 - 50) + "px";
    //         })
    //         .on("mouseout", (event) => {
    //             tooltip.style.opacity = 0;
    //             d3.select(event.target).style("stroke", "none").style("opacity", 1);
    //         });
    // 	}

	// 	// Update color pickers
	// 	if (hasColors) {
	// 		this.renderColorPickers(uniqueColors);
	// 		this.shadowRoot.querySelector(".color-picker-container").style.display = "flex";
	// 	} else if (isStacked && stackVariable) {
	// 		this.shadowRoot.querySelector(".color-picker-container").style.display = "flex";
	// 	} else {
	// 		this.shadowRoot.querySelector(".color-picker-container").style.display = "none";
	// 	}
		
	// 	// Display chart description
	// 	const chartDescription = this.shadowRoot.querySelector(".description");
	// 	chartDescription.textContent = coreData.description;

	// 	// Display legend title
	// 	if (isStacked)
	// 	{
	// 		const legendDescription = this.shadowRoot.querySelector(".legend-title");
	// 		legendDescription.textContent = coreData.encoding.find(element => element.color)?.color.title;
	// 	}
	// 	else 
	// 	{
	// 		const legendDescription = this.shadowRoot.querySelector(".legend-title");
	// 		legendDescription.textContent = coreData.encoding.find(element => element.colors)?.colors.title;
	// 	}
	// }

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
		const isStacked = coreData.encoding.stack === "true";
		// const isGrouped = coreData.encoding.find(element => element.xOffset)?.xOffset.field;
	
		// const xVariable = coreData.encoding.find(element => element.x)?.x.field;
		// const yVariable = coreData.encoding.find(element => element.y)?.y.field;
			
		const isGrouped = coreData.encoding.stack === "false";
		const xVariable = coreData.encoding.x?.field;
		const yVariable = coreData.encoding.y?.field;

		// const xVariableType = coreData.encoding.find(element => element.x)?.x.type;
		// const yVariableType = coreData.encoding.find(element => element.y)?.y.type;
	
		this.xVariable = xVariable;
		this.yVariable = yVariable;
	
		const colorVariable = coreData.encoding.color?.field;
		// const colorVariable = coreData.encoding.find(element => element.colors)?.colors.field;
		const colorRange = coreData.encoding.color?.scale;
		const hasColors = data.some(d => d[colorVariable]);
		const defaultColor = "#cccccc";
		let uniqueColors = hasColors ? [...new Set(data.map(d => d[colorVariable]))] : [];
	
		this.colorScale = d3.scaleOrdinal()
			.domain(uniqueColors)
			.range(colorRange && colorRange.length === uniqueColors.length
				? colorRange
				: d3.quantize(t => d3.interpolateTurbo(t * 0.8 + 0.1), uniqueColors.length));
	
		if (isStacked) {
			data = this.fillMissingStackData(data, coreData, xVariable, yVariable);
		}
	
		const [x, y] = this.drawAxis(data, xVariable, yVariable, isHorizontal, isStacked);
		console.log("aaaaaaa", this.#svg)
	
		if (isStacked) {
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
	

	drawStackedChart(data, coreData, x, y, xVariable, yVariable, isHorizontal, tooltip) {
		const stackVariable = coreData.encoding.color?.field;
		const stackKeys = [...new Set(data.map(d => d[stackVariable]))];
		const stackRange = coreData.encoding.color?.scale;
	
		const stack = d3.stack()
			.keys(d3.union(data.map(d => d[stackVariable])))
			.value(([, d], key) => d.get(key)[yVariable])
			(d3.index(data, d => d[xVariable], d => d[stackVariable]));
	
		const stackColorScale = d3.scaleOrdinal()
			.domain(stackKeys)
			.range(stackRange && stackRange.length === stackKeys.length ? stackRange : d3.schemeCategory10);
		
		this.renderStackLegend(stackKeys, stackColorScale);
	
		const bars = this.#svg.append("g")
			.selectAll("g")
			.data(stack)
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
	
	
	drawGroupedChart(data, coreData, x, y, xVariable, yVariable, colorVariable, colorRange, isHorizontal, hasColors, defaultColor, tooltip) {
		// Get the subgroups
		const groupVariable = coreData.encoding.color?.field;
		const subgroups = [...new Set(data.map(d => d[groupVariable]))];

		const groupColorScale = d3.scaleOrdinal()
			.domain(subgroups)
			.range(colorRange && colorRange.length === subgroups.length ? colorRange : d3.schemeCategory10);

			// scaleBand for groups in each row
			const Subgroup = d3.scaleBand()
				.domain(subgroups)
				.range(isHorizontal ? [0, y.bandwidth()] : [0, x.bandwidth()])
				.padding(0.05);

			this.#svg.append("g")
				.selectAll("g")
				.data(data)
				.join("g")
				.attr("transform", d => isHorizontal ? `translate(0, ${y(d[xVariable])})` : `translate(${x(d[xVariable])}, 0)`)
				.selectAll("rect")
				.data(d => [d])
				.join("rect")
				.attr("x", isHorizontal ? x(0) : d => Subgroup(d[groupVariable]))
				.attr("y", isHorizontal ? d => Subgroup(d[groupVariable]) : d => y(d[yVariable]))
				.attr("height", isHorizontal ? Subgroup.bandwidth() : d =>  y(0) - y(d[yVariable]))
				.attr("width", isHorizontal ? d => x(d[yVariable]) - x(0) : Subgroup.bandwidth)
				// .attr("fill", d => groupColorScale(d[groupVariable]))
				// .attr("fill", d => this.colorScale(d[groupVariable]))
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
	}

	drawRegularChart(data, x, y, xVariable, yVariable, isHorizontal, colorVariable, hasColors, defaultColor, tooltip) {
		this.#svg.append("g")
			.selectAll("rect")
			.data(data)
			.join("rect")
			// Set position and size based on chart orientation
			.attr(isHorizontal ? "x" : "y", d => isHorizontal ? x(0) + 0.5 : y(d[yVariable]))
            .attr(isHorizontal ? "y" : "x", d => isHorizontal ? y(d[xVariable]) :  x(d[xVariable]))
            .attr(isHorizontal ? "width" : "height", d => isHorizontal ? x(d[yVariable]) - x(0) : y(0) - y(d[yVariable]))
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
