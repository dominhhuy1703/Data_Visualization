// const scale_d3 = {'ordinal': d3.scaleOrdinal}


//function to convert rgb object to hex color
function componentToHex(c) {
	var hex = c.toString(16);
	return hex.length == 1 ? "0" + hex : hex;
}
  
function rgbToHex(r, g, b) {
	return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
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
  
	constructor() {
	  super();
	  this.data = null;
	  this.margin = { top: 20, right: 40, bottom: 70, left: 40 };
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
					<div class="legend-title">Language of the country</div>
				</div>

				<div class="chart-container">
					<svg></svg>
					<div class="description">Biểu đồ Bar Chart</div>
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
	drawAxis(data, xVariable, yVariable, isHorizontal=false, isStacked=false, maxLabelLength=5) {
		// Define scales based on direction
		let x, y;
		if (isHorizontal) {
			x = d3.scaleLinear()
				.domain([0, d3.max(data, d => parseInt(d[yVariable]))])
				.range([this.margin.left, this.#width - this.margin.right]);
	
			y = d3.scaleBand()
				.domain(data.map(d => d[xVariable]))
				.range([this.margin.top, this.#height - this.margin.bottom])
				.padding(0.1);
		} else {
			x = d3.scaleBand()
				.domain(data.map(d => d[xVariable]))
				.range([this.margin.left, this.#width - this.margin.right])
				.padding(0.4);
	
			y = d3.scaleLinear()
				.domain([0, d3.max(data, d => parseInt(d[yVariable]))])
				.nice()
				.range([this.#height - this.margin.bottom, this.margin.top]);
		}
		if (isStacked) {
			var result = [];

			data.reduce(function(res, value) {
			if (!res[value[xVariable]]) {
				res[value[xVariable]] = { x: value[xVariable], y: 0 };
				result.push(res[value[xVariable]])
			}
			res[value[xVariable]].y += parseInt(value[yVariable]);
			return res;
			}, {});
			y = d3.scaleLinear()
			.domain([0, d3.max(result, d => d.y)])
			.range([this.#height - this.margin.bottom, this.margin.top]);
		}
	
		// Append axes to the SVG
		const svgElement = this.shadowRoot.querySelector('svg');
		const svg = d3.select(svgElement)
			.attr("width", this.#width).attr("height", this.#height).style("margin", "30px")
			.append("g")
			.attr("transform",
				 "translate(" + this.margin.left + "," + this.margin.top + ")");
	
		const xAxis = isHorizontal? d3.axisBottom(x).tickFormat(function(d){return d < 1000000 ? d : d/1000000 +"  M"}) : d3.axisBottom(x).tickFormat(function(d){return d.length > maxLabelLength ? d.slice(0, maxLabelLength) + "..." : d});
		svg.append("g")
			.attr("transform", `translate(0, ${this.#height - this.margin.bottom})`)
			.call(xAxis)
			.selectAll("text")
			.style("font-size", "10px")
			// .text(d => truncateLabel(d))
				
		var yAxis = isHorizontal? d3.axisLeft(y).tickFormat(function(d){return d.length > maxLabelLength ? d.slice(0, maxLabelLength) + "..." : d}) : d3.axisLeft(y).tickFormat(function(d){return d < 1000000 ? d : d/1000000  + "  M"});
		svg.append("g")
			.attr("transform", `translate(${this.margin.left}, 0)`)
			.call(yAxis)
			.selectAll("text")
			.style("font-size", "10px")
			// .text(d => truncateLabel(d))
	
		// Title for X and Y axes
		svg.append("text")
			.attr("class", "x-axis-label")
			.attr("x", isHorizontal ? (this.#width - this.margin.left - this.margin.right) / 2 : (this.#width - this.margin.left - this.margin.right) / 2)
			.attr("y", this.#height - this.margin.bottom / 2)
			.style("text-anchor", "middle")
			.style("font-size", "18px")
			.text(isHorizontal ? "Population" : "Country");
	
		svg.append("text")
			.attr("class", "y-axis-label")
			.attr("x", isHorizontal ? -(this.#height - this.margin.top - this.margin.bottom) / 2 : - (this.#height - this.margin.top - this.margin.bottom) / 2)
			.attr("y", -this.margin.left + 20)
			.style("text-anchor", "middle")
			.style("font-size", "18px")
			.text(isHorizontal ? "Country" : "Population")
			.attr("transform", "rotate(-90)");

		return [svg, x, y];

	}
	
	// Draw chart
	drawChart() {
		const tooltip = this.shadowRoot.querySelector(".tooltip");
		let coreData = JSON.parse(this.#dataValue); // Parse JSON data
		const data = coreData.data[0].values; // Extract values
		// const width = coreData.width, height = coreData.height;
		// const margin = { top: 20, right: 40, bottom: 70, left: 40 };
		const svgElement = this.shadowRoot.querySelector('svg');
		d3.select(svgElement).selectAll("g").remove(); // Clear previous drawings
		
		// Get the direction (default is vertical)
		const isHorizontal = coreData.direction === "horizontal";
		
		// Add the stacked option
		const isStacked = coreData.stack === "true"; // Check if stacked is true, otherwise default to false

		// Get attributes
		const xVariable = coreData.encoding.find(element => element.x)?.x.field;
		const yVariable = coreData.encoding.find(element => element.y)?.y.field;
		this.xVariable = xVariable;
		this.yVariable = yVariable;
		
		// Create stackVariable
		const stackVariable = coreData.encoding.find(element => element.stacked)?.stacked.field;

		// Set up color scale
		const colorVariable = coreData.encoding.find(element => element.color)?.color.field;
		const hasLanguage = data.some(d => d[colorVariable]);
		const defaultColor = "#cccccc";
		
		let colorScale = coreData.encoding.find((element) => element.color);
		if (colorScale) {
			this.colorScale = d3.scaleOrdinal();
		}

		// Create uniqueLanguage
		let uniqueLanguages = [];
		if (hasLanguage) {
			uniqueLanguages = [...new Set(data.map(d => d[colorVariable]))];
			this.colorScale
				.domain(uniqueLanguages)
				.range(d3.quantize(t => d3.interpolateTurbo(t * 0.8 + 0.1), uniqueLanguages.length));
		}

		const [svg, x, y] = this.drawAxis(data, xVariable, yVariable, isHorizontal, isStacked);

		// If stack
		if (isStacked && stackVariable) {
			const stackKeys = [...new Set(data.map(d => d[stackVariable]))]; 
			// const stackKeys = d3.union(data.map(d => d[stackVariable]))
			
			const stack = d3.stack()
				.keys(d3.union(data.map(d => d[stackVariable])))
				.value(([, d], key) => d.get(key)[yVariable])
				(d3.index(data, d => d[xVariable], d => d[stackVariable]));
				// .value((d, key) => d[key])
				// .order(d3.stackOrderNone)
				// .offset(d3.stackOffsetNone);
			const stackColorScale = d3.scaleOrdinal()
				.domain(stackKeys)
				.range(d3.schemeCategory10); 

			// svg.selectAll("g.layer")
			//     .data(stack)
			//     .enter().append("g")
			//     .attr("class", "layer")
			//     .attr("fill", d => stackColorScale(d.key)) 
			//     .selectAll("rect")
			//     .data(d => d)
			//     .enter().append("rect")
			//     .attr(isHorizontal ? "x" : "y", d => isHorizontal ? x(0) : y(d.data[xVariable]))
			//     .attr(isHorizontal ? "y" : "x", d => isHorizontal ? y(d.data[xVariable]) : x(d.data[xVariable]))
			//     .attr(isHorizontal ? "width" : "height", d => isHorizontal ? x(d[1]) - x(d[0]) : y(0) - y(d[1]))
			//     .attr(isHorizontal ? "height" : "width", isHorizontal ? y.bandwidth() : x.bandwidth())
			//     .on("click", (event, d) => this.showInfoPopup(d))
			//     .on("mouseover", (event, d) => {
			//         tooltip.style.opacity = 1;
			//         tooltip.innerHTML = `<strong>${d.data[xVariable]}</strong>: ${d.data[yVariable]}`;
			//         d3.select(event.target).style("stroke", "black").style("opacity", 1);
			//     })
			//     .on("mousemove", (event) => {
			//         tooltip.style.left = (d3.pointer(event)[0] + width / 2 + 120) + "px";
			//         tooltip.style.top = (d3.pointer(event)[1] + height / 3 - 50) + "px";
			//     })
			//     .on("mouseout", (event) => {
			//         tooltip.style.opacity = 0;
			//         d3.select(event.target).style("stroke", "white").style("opacity", 1);
			//     });
			svg.append("g")
				.selectAll("g")
				.data(stack)
				.join("g")
					.attr("fill", d => stackColorScale(d.key))
				.selectAll("rect")
				.data(D => D)
				.join("rect")
				.attr("x", d => x(d.data[0]))
				.attr("y", d => y(d[1]))
				.attr("height", d => y(d[0]) - y(d[1]))
				.attr("width", x.bandwidth())
				// .on("click", (event, d) => this.showInfoPopup(d))
				// .on("mouseover", (event, d) => {
				// 	tooltip.style.opacity = 1;
				// 	tooltip.innerHTML = `<strong>${d.data[xVariable]}</strong>: ${d.data[yVariable]}`;
				// 	d3.select(event.target).style("stroke", "black").style("opacity", 1);
				// })
				// .on("mousemove", (event) => {
				// 	tooltip.style.left = (d3.pointer(event)[0] + this.#width / 2 + 120) + "px";
				// 	tooltip.style.top = (d3.pointer(event)[1] + this.#height / 3 - 50) + "px";
				// })
				// .on("mouseout", (event) => {
				// 	tooltip.style.opacity = 0;
				// 	d3.select(event.target).style("stroke", "white").style("opacity", 1);
				// });

				// .attr(isHorizontal ? "x" : "y", d => isHorizontal ? x(0) : y(d.data[xVariable]))
				// .attr(isHorizontal ? "y" : "x", d => isHorizontal ? y(d.data[xVariable]) : x(d.data[xVariable]))
				// .attr(isHorizontal ? "width" : "height", d => isHorizontal ? x(d[1]) - x(d[0]) : y(0) - y(d[1]))
				// .attr(isHorizontal ? "height" : "width", isHorizontal ? y.bandwidth() : x.bandwidth());
		// svg.selectAll("g")
		//     .data(stack)
		//     .enter().append("g")
		//     .attr("class", "layer")
		//     .attr("fill", d => stackColorScale(d.key)) 
		//     .selectAll("rect")
		//     .data(d => d)
		//     .enter().append("rect")
		//     .attr(isHorizontal ? "x" : "y", d => isHorizontal ? x(0) : y(d.data[xVariable]))
		//     .attr(isHorizontal ? "y" : "x", d => isHorizontal ? y(d.data[xVariable]) : x(d.data[xVariable]))
		//     .attr(isHorizontal ? "width" : "height", d => isHorizontal ? x(d[1]) - x(d[0]) : y(0) - y(d[1]))
		//     .attr(isHorizontal ? "height" : "width", isHorizontal ? y.bandwidth() : x.bandwidth())
		//     .on("click", (event, d) => this.showInfoPopup(d))
		//     .on("mouseover", (event, d) => {
		//         tooltip.style.opacity = 1;
		//         tooltip.innerHTML = `<strong>${d.data[xVariable]}</strong>: ${d.data[yVariable]}`;
		//         d3.select(event.target).style("stroke", "black").style("opacity", 1);
		//     })
		//     .on("mousemove", (event) => {
		//         tooltip.style.left = (d3.pointer(event)[0] + width / 2 + 120) + "px";
		//         tooltip.style.top = (d3.pointer(event)[1] + height / 3 - 50) + "px";
		//     })
		//     .on("mouseout", (event) => {
		//         tooltip.style.opacity = 0;
		//         d3.select(event.target).style("stroke", "white").style("opacity", 1);
		//     });
	}
	else {
        // Draw normal bars if not stacked
        this.bars = svg.selectAll("rect")
            .data(data)
            .join("rect")
            .attr(isHorizontal ? "x" : "y", d => isHorizontal ? x(0) : y(d[yVariable]))
            .attr(isHorizontal ? "y" : "x", d => isHorizontal ? y(d[xVariable])  : x(d[xVariable]))
            .attr(isHorizontal ? "width" : "height", d => isHorizontal ? x(d[yVariable]) - x(0) : y(0) - y(d[yVariable]))
            .attr(isHorizontal ? "height" : "width", isHorizontal ? y.bandwidth() : x.bandwidth())
            .attr("fill", d => hasLanguage ? this.colorScale(d[colorVariable]) : defaultColor)
            .on("click", (event, d) => this.showInfoPopup(d))
            .on("mouseover", (event, d) => {
                tooltip.style.opacity = 1;
                tooltip.innerHTML = `<strong>${d[xVariable]}</strong>: ${d[yVariable]}`;
                d3.select(event.target).style("stroke", "black").style("opacity", 1);
            })
            .on("mousemove", (event) => {
                tooltip.style.left = (d3.pointer(event)[0] + this.#width / 2 + 120) + "px";
                tooltip.style.top = (d3.pointer(event)[1] + this.#height / 3 - 50) + "px";
            })
            .on("mouseout", (event) => {
                tooltip.style.opacity = 0;
                d3.select(event.target).style("stroke", "none").style("opacity", 1);
            });
    }

		// Update color pickers
		if (hasLanguage) {
			this.renderColorPickers(uniqueLanguages);
		} else {
			this.shadowRoot.querySelector(".color-picker-container").style.display = "none";
		}

		// Display chart description
		const chartDescription = this.shadowRoot.querySelector(".description");
		chartDescription.textContent = coreData.description;
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
	renderColorPickers(uniqueLanguages) {
		let coreData = JSON.parse(this.#dataValue);
		const container = this.shadowRoot.querySelector(".color-picker-container");
		const colorVariable = coreData.encoding.find(element => element.color)?.color.field;
		container.style.display = "block"; // Ensure the color picker container is visible
		uniqueLanguages.forEach((d, index) => {
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
  