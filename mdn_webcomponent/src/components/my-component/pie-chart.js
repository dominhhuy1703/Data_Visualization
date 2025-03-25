const scale_d3 = {'ordinal': d3.scaleOrdinal} //Define scale type using D3.js

//function to convert rgb object to hex color
function componentToHex(c) {
  var hex = c.toString(16);
  return hex.length == 1 ? "0" + hex : hex;
}

function rgbToHex(r, g, b) {
  return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

function getAllIndexes(arr, val) {
  var indexes = [], i;
  for(i = 0; i < arr.length; i++)
      if (arr[i] === val)
          indexes.push(i);
  return indexes;
}

// PieChart Class
class PieChart extends HTMLElement {
  #dataValue = ''; // Store the chart data as a JSON string
  #originalData = null; // Store a copy of the original data for resetting

  constructor() {
    super();
    this.data = null;
    this.startAngle = 0;
    this.endAngle = 2 * Math.PI;
    this.padAngle = 0;
    this.innerRadius = 0;
    this.cornerRadius = 0;
    this.attachShadow({ mode: "open" });
  }

  //Specify the properties to track changes
  static get observedAttributes() {
    return ["data"];
  }

  connectedCallback() {
    this.render(); //Render the component when it's added to the DOM
  }
  

  // attributeChangedCallback(name, oldValue, newValue) {
  //   if (name === "data" && newValue != null) {
  //     this.#dataValue = newValue;
  //     this.#originalData = JSON.parse(newValue); // Save the original data for potential resets
  //     this.removeAttribute("data"); // Remove the attribute
  //     this.drawChart();
  //   }
  // }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === "data" && newValue != null) {
      try {
        this.#dataValue = newValue;
        this.#originalData = JSON.parse(newValue); // Save original data
        this.removeAttribute("data"); // Remove the attribute
        this.drawChart();
      } catch (error) {
        console.error("Error parsing data attribute:", error);
      }
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
            <div class="legend-title">Language of the country</div>
          </div>

          <div class="chart-container">
            <svg></svg>
            <div class="description">Biểu đồ Pie Chart</div>
          </div>
          
          <!-- <div class="controls">
            <label>Start Angle: <input id="input-start-angle" type="range" min="0" max="6.29" step="0.01" value="${this.startAngle}" data-param="startAngle"></label>
            <label>End Angle: <input type="range" min="0" max="6.29" step="0.01" value="${this.endAngle}" data-param="endAngle"></label>
            <label>Pad Angle: <input type="range" min="0" max="0.05" step="0.001" value="${this.padAngle}" data-param="padAngle"></label>
            <label>Inner Radius: <input type="range" min="0" max="180" step="1" value="${this.innerRadius}" data-param="innerRadius"></label>
            <label>Corner Radius: <input type="range" min="0" max="20" step="0.5" value="${this.cornerRadius}" data-param="cornerRadius"></label>
            <div class="sort-container">
              <label for="sort-toggle">Sort</label>
              <input type="checkbox" id="sort-toggle">
            </div>
          </div> -->
          <div class="tooltip"></div>
        </div>
      </div>
    `;

    // // Add event listener to change value on slider
    // this.shadowRoot.querySelectorAll(".controls input").forEach(input => {
    //   input.addEventListener("input", (event) => this.updateParams(event));
    // });

    // // Add event for data sort button
    // this.shadowRoot.querySelector("#sort-toggle").addEventListener("change", (event) => {
    //   if (event.target.checked) {
    //     this.sortData(); // If chose, call sortData
    //   } else {
    //     this.restoreData(); // Else, call restoreData
    //   }
    // });
  }

  // Update parameters when user changes slider
  updateParams(event) {
    this[event.target.dataset.param] = parseFloat(event.target.value);
    this.drawChart();
  }

  // Sort the data in descending order
  sortData() {
    let coreData = JSON.parse(this.#dataValue);
    coreData.data[0].values.sort((a, b) => b[populationVariable] - a[populationVariable]);
    this.#dataValue = JSON.stringify(coreData);
    this.drawChart();
  }  

  // Restore the original data order
  restoreData() {
    if (this.#originalData) {
      this.#dataValue = JSON.stringify(this.#originalData);
    }
    this.drawChart();
  }

  togglePopup(show) {
    const popup = this.shadowRoot.querySelector(".popup");
    popup.classList.toggle("show", show);
  }

  drawChart() {
    const tooltip = this.shadowRoot.querySelector(".tooltip");
    let coreData = JSON.parse(this.#dataValue);
    let data = coreData.data[0].values; // Extract values from the dataset
    const width = coreData.width, height = coreData.height;
    const radius = Math.min(width, height) / 2;
    const svgElement = this.shadowRoot.querySelector("svg");
    d3.select(svgElement).selectAll("g").remove(); // Clear previous drawings
    const countryVariable = coreData.encoding.find(element => element.id)?.id.field; // attribute countryVariable
    const populationVariable = coreData.encoding.find(element => element.theta)?.theta.field; // attribute populationVariable

    const legendContainer = this.shadowRoot.querySelector(".color-picker-container");
    legendContainer.innerHTML = '<div class="legend-title">Language of the country</div>';
    
    const colorVariable = coreData.encoding.find(element => element.color)?.color.field; // attribute colorVariable
    
    const hasLanguage = data.some(d => d[colorVariable]); // Check if data has "language"
    const defaultColor = "#cccccc";

    // Initialize color scale
    // let colorScale = coreData.scales.find((element) => element.name == "color");
    // if (colorScale) {
    //   this.colorScale = scale_d3[colorScale.type]();
    // }
    // else {
    //   this.colorScale = d3.scaleOrdinal();
    // }

    // let a = coreData.scales.find(element => element.name === "color")?.domain.field;

    // const truthCheckCollection = (collection, pre) =>
    //   collection.every(obj => obj[pre]);
    // console.log(truthCheckCollection(data, "c"));

    // const colorVariable = coreData.scales.find(element => element.name === "color")?.domain.field;
    // const listLanguage = [...new Set(data.map((material) => material.language))];
    // this.colorScale
    //   .domain(data.map(d => d.language)) // Use `x` values for colors
    //   // .range(["#ff6347", "#4682b4", "#32cd32", "#ffcc00", "#8a2be2", "#9faecd"]);
    //   //.range(["#ff6347"]);
    //   .range(d3.quantize(t => d3.interpolateTurbo(t * 0.8 + 0.1), listLanguage.length).reverse());
    
    // Color scale
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


    // Define arc shape
    const arcShape = d3.arc()
      .innerRadius(this.innerRadius)
      .outerRadius(radius - 0.9)
      .cornerRadius(this.cornerRadius);
    const arcShapeLabels = d3.arc().outerRadius(radius - 0.85).innerRadius(radius * 0.6);
    
    // Define pie data structure
    const pieDataStructure = d3.pie()
      .sort(null)
      .startAngle(this.startAngle)
      .endAngle(this.endAngle)
      .padAngle(this.padAngle)
      .value(d => d[populationVariable])(data); // Use `y` values as the pie segment sizes

    // Create SVG element and position the chart in the center
    const svg = d3.select(svgElement)
    .attr("width", width).attr("height", height).style("margin", "50px")
    .append("g").attr("transform", `translate(${width / 2}, ${height / 2})`);
    
    // Draw pie chart segments
    this.paths = svg.selectAll("path")
      .data(pieDataStructure)
      .join("path")
      .attr("fill", d => hasLanguage ? this.colorScale(d.data[colorVariable]) : defaultColor) // Use provided color or generate one
      .attr("d", arcShape)
      .attr("stroke", "white")
      .on("click", (event, d) => alert(`Clicked on: ${d.data[countryVariable]}, ${d.data[populationVariable]}`))
      .on("mouseover", (event, d) => {
        tooltip.style.opacity = 1;
        tooltip.innerHTML = `<strong>${d.data[countryVariable]}</strong>: ${d.data[populationVariable]}`;
        d3.select(event.target).style("stroke", "black").style("opacity", 1);
      })
      .on("mousemove", (event) => {
        tooltip.style.left = (d3.pointer(event)[0] + width) + "px";
        tooltip.style.top = (d3.pointer(event)[1] + height - 100) + "px";
      })
      .on("mouseout", (event) => {
        tooltip.style.opacity = 0;
        d3.select(event.target).style("stroke", "white").style("opacity", 1);
      });


      // Display chart description
      const chartDescription = this.shadowRoot.querySelector(".description");
      chartDescription.textContent = coreData.description;

    const textGroup = svg.append("g")
      .attr("font-family", "arial")
      .attr("font-size", "12px")
      .attr("font-weight", 550)
      .attr("text-anchor", "middle");

      textGroup.selectAll("text")
      .data(pieDataStructure)
      .join("text")
      .attr("transform", d => {
        const centroid = arcShapeLabels.centroid(d);
        return `translate(${centroid[0]},${centroid[1]})`;
      })
      .each(function(d) {
        const textElement = d3.select(this);
        const originalText = d.data[countryVariable];
        const displayText = originalText.length > 5 ? originalText.slice(0, 5) + "..." : originalText; 

        textElement.append("tspan")
          .attr("x", 0)
          .attr("dy", "0em")
          .text(displayText);

        textElement.append("tspan")
          .attr("x", "0")
          .attr("dy", "1.2em")
          .text((d.data[populationVariable] / 1_000_000).toFixed(1) + " M");
      });

      // Check hasLanguage
      if (hasLanguage) {
        this.renderColorPickers(uniqueLanguages);
      } else {
        legendContainer.style.display = "none";
      }
  }

  // Render Color Picker
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

  // Update Color
  updateColor(event, coreData, colorVariable, label) {
    let data = coreData.data[0].values
    let listColorCriteria = data.map(d => d[colorVariable]) // Get list of color-related data attributes
    const indexs = getAllIndexes(listColorCriteria, label); // Find all indexes of the current label
    for (const index of indexs) {
      const newColor = event.target.value; // Get the new color selected by the user
      data[index].color = newColor; // Update color in dataset
      const path = this.shadowRoot.querySelectorAll("path")[index]; // Get the corresponding pie chart segment
      d3.select(path)
        .transition()
        .duration(300)
        .attr("fill", newColor);
    }
    this.#dataValue = JSON.stringify(data); // Update data
  }

  get dataValue() {
    return this.#dataValue;
  }

  set dataValue(data) {
    this.#dataValue = data;
  }
}

customElements.define("pie-chart", PieChart);
