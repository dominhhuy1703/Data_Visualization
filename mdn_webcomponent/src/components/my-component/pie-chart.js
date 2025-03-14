const scale_d3 = {'ordinal': d3.scaleOrdinal} //Define scale type using D3.js

class PieChart extends HTMLElement {
  #dataValue = ''; // Store the chart data as a JSON string
  #originalData = null; // Store a copy of the original data for resetting

  constructor() {
    super();
    this.data = null;
    this.attachShadow({ mode: "open" });
  }

  static get observedAttributes() {
    return ["data"];
  }

  connectedCallback() {
    this.render(); //Render the component when it's added to the DOM
    // Initialize input values with signal values
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === "data" && newValue != null) {
      this.#dataValue = newValue;
      this.#originalData = JSON.parse(newValue); // Save the original data for potential resets
      this.removeAttribute("data"); // Remove the attribute
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
          flex-direction: row; /* Xếp biểu đồ và controls theo hàng ngang */
          align-items: center;
          justify-content: center;
          gap: 10px;
          width: 100%;
        }

        .chart-container {
          display: flex;
          flex-direction: column; /* Biểu đồ trên, description dưới */
          align-items: center;
        }

          
        .popup { 
          display: none; 
          position: fixed; 
          top: 50%; 
          left: 50%; 
          transform: translate(-50%, -50%); 
          background: white; 
          padding: 20px; 
          border-radius: 10px; 
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3); 
          z-index: 11; 
        }

        .popup.show { display: block; }
        .overlay { 
          display: none; 
          position: fixed; 
          width: 100%; 
          height: 100%; 
          background: rgba(0, 0, 0, 0.5); 
          z-index: 10; 
        }

        .overlay.show { display: block; }
        .color-picker-container { 
          display: flex; 
          flex-direction: column; 
        }

        .color-item { 
          display: flex; 
          align-items: center; 
          font-size: 14px; 
          margin-bottom: 5px; 
        }

        .color-item label { 
          min-width: 100px; 
          font-weight: bold; 
        }

        .color-item input { 
          width: 35px; 
          height: 35px; 
          border: none; 
          cursor: pointer; 
        }

        .change-color-btn { 
          position: absolute; 
          top: 10px; 
          right: 10px; 
          padding: 8px 12px; 
          background: #007bff; 
          color: white; 
          border: none; 
          cursor: pointer; 
          border-radius: 5px; 
          font-weight: bold; 
        }

        .change-color-btn:hover { background: #0056b3; }

        .close-popup { 
          margin-top: 10px; 
          padding: 8px 12px; 
          background: #dc3545; 
          color: white; 
          border: none; 
          cursor: pointer; 
          border-radius: 5px; 
          font-weight: bold; 
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
          width: 200px; /* Đảm bảo label và input không bị quá dài */
        }

        .controls input[type="range"] {
          flex-grow: 1; /* Slider sẽ giãn theo label */
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
          <div class="chart-container">
            <svg></svg> <!-- Biểu đồ -->
            <div class="description">Biểu đồ Pie Chart</div>
          </div>
          <div class="controls">
            <label>Start Angle: <input id="input-start-angle" type="range" min="0" max="6.29" step="0.01" value="0" data-param="startAngle"></label>
            <label>End Angle: <input type="range" min="0" max="6.29" step="0.01" value="6.29" data-param="endAngle"></label>
            <label>Pad Angle: <input type="range" min="0" max="0.05" step="0.001" value="0" data-param="padAngle"></label>
            <label>Inner Radius: <input type="range" min="0" max="180" step="1" value="0" data-param="innerRadius"></label>
            <label>Corner Radius: <input type="range" min="0" max="20" step="0.5" value="0" data-param="cornerRadius"></label>
            <div class="sort-container">
              <label for="sort-toggle">Sort</label>
              <input type="checkbox" id="sort-toggle">
            </div>
            </div>
          <div class="tooltip"></div>
          <button class="change-color-btn">Change Color</button>
          <div class="overlay"></div>
          <div class="popup">
            <div class="color-picker-container"></div>
            <button class="close-popup">Close</button>
          </div>
        </div>
      </div>
    `;
    this.shadowRoot.querySelectorAll(".controls input").forEach(input => {
      input.addEventListener("input", (event) => this.updateParams(event));
    });
    this.shadowRoot.querySelector("#sort-toggle").addEventListener("change", (event) => {
      if (event.target.checked) {
        this.sortData(); // If chose, call sortData
      } else {
        this.restoreData(); // Else, call restoreData
      }
    });
    this.shadowRoot.querySelector(".change-color-btn").addEventListener("click", () => this.togglePopup(true));
    this.shadowRoot.querySelector(".close-popup").addEventListener("click", () => this.togglePopup(false));
    this.shadowRoot.querySelector(".overlay").addEventListener("click", () => this.togglePopup(false));
  }

  // initInputPanelValues(element){
  //   element.min = 
  //   element.max = 
  //   element.step = 
  //   element.value = 
  //   this.shadowRoot.querySelector(".sort-btn").min = 
  //   this.shadowRoot.querySelector(".sort-btn").min = 
    
  // }

  // initParams(event) {
  //   let coreData = JSON.parse(this.#dataValue);
  //   let signal = coreData.signals.find(element => element.name === event.target.dataset.param);
  //   if (signal) {
  //     signal.value = this[event.target.dataset.param];  // Cập nhật giá trị mới vào signals
  //   }
  
  //   this.#dataValue = JSON.stringify(coreData);
  //   this.drawChart();
  // }

  updateParams(event) {
    console.log("Updating params:", event.target.dataset.param, event.target.value);
    this[event.target.dataset.param] = parseFloat(event.target.value);
  
    // Update value in coreData.signals
    let coreData = JSON.parse(this.#dataValue);
    let signal = coreData.signals.find(element => element.name === event.target.dataset.param);
    if (signal) {
      signal.value = this[event.target.dataset.param];  // Update new value to signals
    }
  
    this.#dataValue = JSON.stringify(coreData); // Update dataValue with new value
    this.drawChart(); 
  }

  // Sort the data in descending order
  sortData() {
    let coreData = JSON.parse(this.#dataValue);
    coreData.data[0].values.sort((a, b) => b.y - a.y);
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
    console.log("Radius:", radius)
    const svgElement = this.shadowRoot.querySelector("svg");
    d3.select(svgElement).selectAll("g").remove(); // Clear previous drawings


    // Extract chart parameters from the dataset
    let startAngle = coreData.signals.find(element => element.name === "startAngle")?.value;
    console.log("AAAA", startAngle)
    let endAngle = coreData.signals.find(element => element.name === "endAngle")?.value;
    console.log("BBBBB", endAngle)
    let padAngle = coreData.signals.find(element => element.name === "padAngle")?.value;
    console.log("CCC", padAngle)
    let innerRadius = coreData.signals.find(element => element.name === "innerRadius")?.value;
    console.log("Updated innerRadius:", innerRadius);
    let cornerRadius = coreData.signals.find(element => element.name === "cornerRadius")?.value;
    console.log("Drawing chart with params:", startAngle, endAngle, padAngle, innerRadius, cornerRadius);
    
    // Initialize color scale
    let colorScale = coreData.scales.find((element) => element.name == "color");
    if (colorScale) {
      this.colorScale = scale_d3[colorScale.type]();
    }
    else {
      this.colorScale = d3.scaleOrdinal();
    }


    // const truthCheckCollection = (collection, pre) =>
    //   collection.every(obj => obj[pre]);
    // console.log(truthCheckCollection(data, "c"));

    this.colorScale
      .domain(data.map(d => d.x)) // Use `x` values for colors
      .range(["#ff6347", "#4682b4", "#32cd32", "#ffcc00", "#8a2be2", "#9faecd"]);
      //.range(["#ff6347"]);
    

    // Define arc shape
    // const arcShape = d3.arc().innerRadius(radius * 0.4).outerRadius(radius - 0.9);
    const arcShape = d3.arc()
      .innerRadius(innerRadius)
      .outerRadius(radius - 0.9)
      .cornerRadius(cornerRadius);
      console.log("arcShape innerRadius:", arcShape.innerRadius()());
      console.log("arcShape cornerRadius:", arcShape.cornerRadius()());
    const arcShapeLabels = d3.arc().outerRadius(radius - 0.85).innerRadius(radius * 0.6);
    
    // Define pie data structure
    const pieDataStructure = d3.pie()
      .sort(null)
      .startAngle(startAngle)
      .endAngle(endAngle)
      .padAngle(padAngle)
      .value(d => d.y)(data); // Use `y` values as the pie segment sizes

    // Create SVG element and position the chart in the center
    const svg = d3.select(svgElement)
    .attr("width", width).attr("height", height).style("margin", "50px")
    .append("g").attr("transform", `translate(${width / 2}, ${height / 2})`);
    
    // Draw pie chart segments
    this.paths = svg.selectAll("path")
      .data(pieDataStructure)
      .join("path")
      .attr("fill", d => d.data.c || this.colorScale(d.data.x)) // Use provided color or generate one
      .attr("d", arcShape)
      .attr("stroke", "white")
      .on("click", (event, d) => alert(`Clicked on: ${d.data.x}, ${d.data.y}`))
      .on("mouseover", (event, d) => {
        tooltip.style.opacity = 1;
        tooltip.innerHTML = `<strong>${d.data.x}</strong>: ${d.data.y.toFixed(1)}`;
        d3.select(event.target).style("stroke", "black").style("opacity", 1);
      })
      .on("mousemove", (event) => {
        tooltip.style.left = (d3.pointer(event)[0] + width/2  + 70) + "px";
        tooltip.style.top = (d3.pointer(event)[1] + height/2 + 70) + "px";
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
      .attr("font-size", 12)
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
        const originalText = d.data.x;
        const displayText = originalText.length > 5 ? originalText.slice(0, 5) + "..." : originalText; 

        textElement.append("tspan")
          .attr("x", 0)
          .attr("dy", "0em")
          .text(displayText);

        textElement.append("tspan")
          .attr("x", "0")
          .attr("dy", "1.2em")
          .text(d.data.y);
      });

    this.renderColorPickers(data);
  }

  renderColorPickers(data) {
    const container = this.shadowRoot.querySelector(".color-picker-container");
    container.innerHTML = data.map((d, index) => `
      <div class="color-item">
        <label>${d.x}</label>
        <input type="color" value="${d.color || this.colorScale(d.x)}" data-index="${index}">
      </div>
    `).join("");

    container.querySelectorAll("input[type='color']").forEach(input => {
      input.addEventListener("input", (event) => this.updateColor(event, data));
    });
  }

  updateColor(event, data) {
    const index = event.target.dataset.index;
    const newColor = event.target.value;
    data[index].color = newColor;

    const path = this.shadowRoot.querySelectorAll("path")[index];
    d3.select(path)
      .transition()
      .duration(300)
      .attr("fill", newColor);

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
