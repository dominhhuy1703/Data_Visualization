const scale_d3 = {'ordinal': d3.scaleOrdinal, 'quantitative': d3.scaleLinear, 'nominal': d3.scaleBand} //Define scale type using D3.js

// import * as d3 from 'd3';
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

import {
	parseD3ColorScheme,
	createColorScale,
	getAllIndexes
} from './utilities/color-utils.js';

// PieChart Class
export default class PieChart extends HTMLElement {
  #dataValue = '';
	#coreData = null;
	#data = null;
	#width = 400;
	#height = 400;
	#svg = null;
	#defaultColor = "#cccccc";
	#tempConfig = {
		data: null,
		encoding: null,
		description: '',
		width: 400,
		height: 400,
	};
  
  constructor() {
    super();
    this.data = null;
    this.attachShadow({ mode: "open" });
  }

  //Specify the properties to track changes
  static get observedAttributes() {
    return ["data", 'width', 'height', 'description', 'encoding'];
  }

  connectedCallback() {
    this.render(); //Render the component when it's added to the DOM
  }

  attributeChangedCallback(name, oldValue, newValue) {
		if (newValue == null) return;
		switch (name) {
			case 'width':
				this.#tempConfig.width = parseInt(newValue);
				break;
			case 'height':
				this.#tempConfig.height = parseInt(newValue);
				break;
			case 'description':
				this.#tempConfig.description = newValue;
				break;
			case 'encoding':
				try {
					this.#tempConfig.encoding = JSON.parse(newValue);
				} catch (e) {
					console.error('Invalid encoding JSON', e);
				}
				break;
			case 'data':
			try {
				const parsedData = JSON.parse(newValue);
				const rawData = Array.isArray(parsedData) ? parsedData : parsedData.values || parsedData;
				this.#tempConfig.data = rawData.map(d => {
					const flattened = {};
					for (const [key, valObj] of Object.entries(d)) {
						if (valObj?.value !== undefined) {
							const num = Number(valObj.value);
							flattened[key] = isNaN(num) ? valObj.value : num;
						} else {
							flattened[key] = d[key]; // fallback for non-SPARQL
						}
					}
					return flattened;
				});
			} catch (e) {
				console.error('Invalid data JSON', e);
			}
			break;
		}
		
		this.removeAttribute(name);

		// Check that's enough neccesary data to render
		if (this.#tempConfig.data && this.#tempConfig.encoding) {
			this.#data = this.#tempConfig.data;
			this.#width = this.#tempConfig.width;
			this.#height = this.#tempConfig.height;
			this.#coreData = {
				data: { values: this.#data },
				encoding: this.#tempConfig.encoding,
				width: this.#width,
				height: this.#height,
				description: this.#tempConfig.description,
			};
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
    console.log("AAAAAAA", data)
    const svgElement = this.shadowRoot.querySelector('svg');
    d3.select(svgElement).selectAll("g").remove();
    this.#svg = d3.select(svgElement)
      .attr("width", this.#width).attr("height", this.#height).style("margin", "50px")
      .append("g").attr("transform", `translate(${this.#width / 2}, ${this.#height / 2})`);

    const radius = Math.min(this.#width, this.#height) / 2;
    const textVariable = this.#coreData.encoding.text?.field || null;
		const thetaVariable = this.#coreData.encoding.theta?.field || null;

    this.textVariable = textVariable;
    this.thetaVariable = thetaVariable;
    
    const colorVariable = this.#coreData.encoding.color?.field || this.#defaultColor;

    // Color scale
    const hasColors = data.some(d => d[colorVariable]);
    let colorField = hasColors ? [...new Set(data.map(d => d[colorVariable]))] : [];
    let colorScale = this.#coreData.encoding.color?.scale || null;
    let colorDomain = Array.isArray(colorScale?.domain) ? colorScale.domain : [];
    let rawColorRange = colorScale?.range;
    let colorRange;

    if (colorScale) {
      this.colorScale = d3.scaleOrdinal();
    }
    // Parse the raw color range if it's a string (i.e., D3 scheme or interpolator name)
		if (typeof rawColorRange === 'string') {
			parsedColor = parseD3ColorScheme(rawColorRange);
		} else {
			// Otherwise assume it's already a valid color array
			colorRange = rawColorRange;
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
  console.log("Theta value:", d[this.thetaVariable]);
  return +d[this.thetaVariable];
})
      .sort(null); // giữ nguyên thứ tự nếu muốn

      console.log("Raw data", data);
console.log("Theta variable", this.thetaVariable);
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
      chartDescription.textContent = this.#coreData.description;

    const textGroup = this.#svg.append("g")
      .attr("font-family", "arial")
      .attr("font-size", "12px")
      .attr("font-weight", 550)
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
          .attr("dy", "0em")
          // .text(displayText);

        textElement.append("tspan")
          .attr("x", "0")
          .attr("dy", "1.2em")
          .text((d.data[thetaVariable] / 1_000_000).toFixed(1) + " M");
      });

      // Check hasColors
      if (hasColors) {
        this.renderColorPickers(this.finalColorDomain);
        this.shadowRoot.querySelector(".color-picker-container").style.display = "flex";

      } else {
			this.shadowRoot.querySelector(".color-picker-container").style.display = "none";
      }
  }

  // Render color pickers for each bar based on data
    renderColorPickers(colorField) {
      const container = this.shadowRoot.querySelector(".color-picker-container");
      const colorVariable = this.#coreData.encoding.color?.field;
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
    let listColorCriteria = this.#data.map(d => d[colorVariable]) // Get list of color-related data attributes
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
