// const scale_d3 = {'ordinal': d3.scaleOrdinal}

//function to convert rgb object to hex color
function componentToHex(c) {
	var hex = c.toString(16);
	return hex.length == 1 ? "0" + hex : hex;
}
  
function rgbToHex(r, g, b) {
	return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}


class BarChart extends HTMLElement {
	#dataValue = '';
  
	constructor() {
	  super();
	  this.data = null;
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
					<div class="legend-title">Legend</div>
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
	
	// Draw chart
	drawChart() {
		const tooltip = this.shadowRoot.querySelector(".tooltip");
		let coreData = JSON.parse(this.#dataValue); // Parse the JSON data
		const data = coreData.data[0].values; // Extract the values from the parsed data
		const width = coreData.width, height = coreData.height;
		const margin = { top: 20, right: 0, bottom: 70, left: 30 };
		const svgElement = this.shadowRoot.querySelector('svg');
		d3.select(svgElement).selectAll("g").remove(); // Clear previous drawings
		
		const countryVariable = coreData.scales.find(element => element.name === "country")?.domain.field; // attribute countryVariable
    	const populationVariable = coreData.scales.find(element => element.name === "population")?.domain.field; // attribute populationVariable

		const legendContainer = this.shadowRoot.querySelector(".color-picker-container");
		legendContainer.innerHTML = '<div class="legend-title">Language of the country</div>';
		const colorVariable = coreData.scales.find(element => element.name === "color")?.domain.field;
		const hasLanguage = data.some(d => d[colorVariable]);
		const defaultColor = "#cccccc";
		

		// Define color scale for bars based on data categories (color or other attributes)
		let colorScale = coreData.scales.find((element) => element.name == "color");

		if (colorScale) {
			this.colorScale = scale_d3[colorScale.type]();
		}
		else {
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

		// Set domain and range for color scale
		// this.colorScale
		// 	.domain(data.map(d => d.x))
		// 	.range(["#4682b4"]);

		// Set up scales for X and Y axes
		const x = d3.scaleBand().domain(data.map(d => d[countryVariable])).range([margin.left, width - margin.right]).padding(0.5);
		const y = d3.scaleLinear()
			.domain([0, d3.max(data, d => d[populationVariable] / 1_000_000)]) // Divide into 1 million
			.nice()
			.range([height - margin.bottom, margin.top]);
		
		// Append axes to the SVG
		const svg = d3.select(svgElement)
			.attr("width", width).attr("height", height).style("margin", "20px")
			.append("g")
			.attr("transform",
				"translate(" + margin.left + "," + margin.top + ")");;
		
		// X-axis
		const xAxis = svg.append("g")
			.attr("transform", `translate(0,${height - margin.bottom})`)
			.call(d3.axisBottom(x));
		
		// title for x axis
		svg.append("text")
		.attr("class", "x-axis-label")
		.attr("x", (width - margin.left - margin.right) / 2)
		.attr("y", height - margin.bottom / 2 ) // 
		.style("text-anchor", "middle")
		.style("font-size", "18px")
		.text("Country");
		
		// Truncate long x-axis labels and add tooltips
		xAxis.selectAll("text")
			.style("font-size", "12px") 
			.text(d => d.length > 5 ? d.slice(0, 5) + "..." : d) // Shorten if > 5 characters
			.append("title") 
			.attr("dy", "1em")
			.text(d => d);
		
		// Y-axis
		svg.append("g").attr("transform", `translate(${margin.left},0)`).call(d3.axisLeft(y));
		
		 // title for y axis
		 svg.append("text")
		 .attr("class", "y-axis-label")
		 .attr("x", - (height - margin.top - margin.bottom) / 2)
		 .attr("y", - margin.left + 20) 
		 .style("text-anchor", "middle")
		 .style("font-size", "18px")
		 .text("Population (Millions)")
		 .attr("transform", "rotate(-90)");

		// Draw bars on the chart
		this.bars = svg.selectAll("rect")
			.data(data)
			.join("rect")
			.attr("x", d => x(d[countryVariable]))  // Position each bar based on data.x
			.attr("y", d => y(d[populationVariable] / 1_000_000))  // Position each bar based on data.y
			.attr("height", d => {
				let heightValue = Math.max(0, y(0) - y(d[populationVariable] / 1_000_000));
				return heightValue;
			})   // Calculate height of each bar
			
			.attr("width", x.bandwidth()) //Set width of each bar
			.attr("fill", d => hasLanguage ? this.colorScale(d[colorVariable]) : defaultColor) // Fill color based on category
			// .attr("fill", d => d.color || this.colorScale(d.x))

			.on("click", (event, d) => this.showInfoPopup(d)) // Popup bar click
			
			.on("mouseover", (event, d) => {
				tooltip.style.opacity = 1;
				tooltip.innerHTML = `<strong>${d[countryVariable]}</strong>: ${d[populationVariable]}`;
				d3.select(event.target).style("stroke", "black").style("opacity", 1);
			  })
			  .on("mousemove", (event) => {
				tooltip.style.left = (d3.pointer(event)[0] + width/2 + 100) + "px";
				tooltip.style.top = (d3.pointer(event)[1] + height/3 - 70) + "px";
			  })
			  .on("mouseout", (event) => {
				tooltip.style.opacity = 0;
				d3.select(event.target).style("stroke", "white").style("opacity", 1);
			  });
			
			// Tooltip
			// .on("mouseover", (event, d) => {
			// 	tooltip.style.opacity = 1;
			// 	tooltip.innerHTML = `<strong>${d.name}</strong>: ${d.population}`;
				
			// 	// Highlight on hover
			// 	d3.select(event.target)
			// 		.attr("fill", "red") // Red
			// 		.style("stroke", "black")
			// 		.style("opacity", 1);
			
			// 	// Display the value
			// 	svg.append("text")
			// 		.attr("class", "hover-value")
			// 		.attr("x", x(d.name) + x.bandwidth() / 2)
			// 		.attr("y", y(d.population) - 10)
			// 		.attr("text-anchor", "middle")
			// 		.attr("fill", "black")
			// 		.style("font-size", "16px")
			// 		.text(d.y);
			// })
			// .on("mousemove", (event) => {
			// 	tooltip.style.left = (d3.pointer(event)[0] + width/3 - 100) + "px";
        	// 	tooltip.style.top = (d3.pointer(event)[1] + height/3 - 100) + "px";
			// })
			// .on("mouseout", (event, d) => {
			// 	tooltip.style.opacity = 0;
			
			// 	d3.select(event.target)
			// 		// .attr("fill", d => d.c || this.colorScale(d.x)) // Quay lại màu ban đầu
			// 		.style("stroke", "none")
			// 		.style("opacity", 1);
			
			// 	// Remove value when hovering out
			// 	svg.selectAll(".hover-value").remove();
			// });
	
		svg.selectAll(".bar-value")
			.data(data)
			.join("text")
			.attr("class", "bar-value")
			.attr("x", d => x(d[countryVariable]) + x.bandwidth() / 2)
			.attr("y", d => y(d[populationVariable]) - 10)
			.attr("text-anchor", "middle")
			.attr("fill", "black")
			.style("font-size", "16px")
			.text(d => d.y);
		
		// Display chart description
		const chartDescription = this.shadowRoot.querySelector(".description");
		chartDescription.textContent = coreData.description;
		if (hasLanguage) {
			this.renderColorPickers(uniqueLanguages);
		  } else {
			legendContainer.style.display = "none";
		  } // Render color pickers for bars
	}
	
	// Show information popup with data details when a bar is clicked
	showInfoPopup(d) {
	  const infoPopup = this.shadowRoot.querySelector(".info-popup");
	  infoPopup.innerHTML = `
		<div>Tag: ${d[countryVariable]}</div>
		<div>Value: ${[populationVariable]}</div>
		<button class="close-popup">Close</button>
	  `;
	  infoPopup.classList.add("show");
	  this.shadowRoot.querySelector(".close-popup").addEventListener("click", () => infoPopup.classList.remove("show"));
	}
	
	// Render color pickers for each bar based on data
	renderColorPickers(uniqueLanguages) {
		let coreData = JSON.parse(this.#dataValue);
		const container = this.shadowRoot.querySelector(".color-picker-container");
		const colorVariable = coreData.scales.find(element => element.name === "color")?.domain.field;
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

	// renderColorPickers(data, colorScale) {
	// 	const container = this.shadowRoot.querySelector(".color-picker-container");
	// 	container.style.display = "block";
	  
	// 	data.forEach((d, index) => {
	// 		const colorItem = document.createElement("div");
	// 		colorItem.classList.add("color-item");
		
	// 		const label = document.createElement("label");
	// 		label.textContent = d.colorVariable;
		
	// 		const input = document.createElement("input");
	// 		input.type = "color";
	// 		input.value = d3.color(colorScale(d.colorVariable)).formatHex();
	// 		input.setAttribute("data-index", index);
		
	// 		colorItem.appendChild(label);
	// 		colorItem.appendChild(input);
	// 		container.appendChild(colorItem);
		
	// 		input.addEventListener("input", (event) => this.updateColor(event, data));
	// 	});
	// }
	
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
	// updateColor(event, data) {
	//   const index = event.target.dataset.index;
	//   const newColor = event.target.value;
	//   data[index].color = newColor;
  
	//   // Find column and update color
	//   const bar = this.shadowRoot.querySelectorAll("rect")[index];
	//   d3.select(bar)
	// 	.transition()
	// 	.duration(300)
	// 	.attr("fill", newColor);
  
	//   this.#dataValue = JSON.stringify(data); // Update data
	// }
	
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
  