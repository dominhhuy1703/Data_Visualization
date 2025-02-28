class PieChart extends HTMLElement {
  
  #dataValue = '';

  constructor() {
    super();
    this.data = null;
    this.attachShadow({ mode: "open" });
  }

  static get observedAttributes() {
    return ["data"];
  }

  connectedCallback() {
    this.render();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === "data" && newValue != null) {
        this.#dataValue = newValue; 
        this.removeAttribute("data");
        this.drawChart();
        // this.renderColorPickers();
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
        * {
            box-sizing: border-box;
        }
        .container {
            display: flex;
            justify-content: center;
            align-items: center;
            width: 100%;
            height: 100%;
        }
        .pie-chart-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 20px;
            background: white;
            border-radius: 10px;
            box-shadow: 0px 5px 15px rgba(0, 0, 0, 0.2);
            gap: 20px;
        }
        .pie-chart {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            position: relative;
        }
        .pie-chart svg {
            width: 450px;
            height: 450px;
        }
        .color-picker-container {
            position: absolute;
            top: 10px;
            left: 10px;
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            background: rgba(255, 255, 255, 0.9);
            padding: 10px;
            border-radius: 8px;
            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
        }
        .color-item {
            display: flex;
            align-items: center;
            font-size: 14px;
        }
        .color-item label {
            min-width: 80px;
            font-weight: bold;
        }
        .color-item input {
            width: 30px;
            height: 30px;
            border: none;
            cursor: pointer;
        }
        .pie-chart path {
            transition: transform 0.3s ease, fill 0.3s ease;
        }
        .pie-chart path:hover {
            transform: scale(1.05);
            fill: gray !important;
        }
    </style>


      <div class="container">
        <svg width="400" height="400"></svg>
        <div class="color-picker-container"></div>
      </div>
      
    `;
  }

  drawChart() {
    const svgElement = this.shadowRoot.querySelector("svg");
    const data = JSON.parse(this.dataValue);
    const width = 400, height = 400;
    const radius = Math.min(width, height) / 2;
    d3.select(svgElement).selectAll("g").remove();

    // Mảng màu mặc định
    this.colorScale = d3.scaleOrdinal()
      .domain(data.map(d => d.tag))
      .range(["#ff6347", "#4682b4", "#32cd32", "#ffcc00", "#8a2be2", "#9faecd"]);

    const arcShape = d3.arc().innerRadius(radius * 0.4).outerRadius(radius - 0.9);
    const arcShapeLabels = d3.arc().outerRadius(radius - 0.85).innerRadius(radius * 0.6);
    const pieDataStructure = d3.pie().sort(null).value(d => d.value)(data);
    const svg = d3.select(svgElement)
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${width / 2}, ${height / 2})`);

    this.paths = svg.selectAll("path")
      .data(pieDataStructure)
      .join("path")
      .attr("fill", d => d.data.color || this.colorScale(d.data.tag))
      .attr("d", arcShape)
      .attr("stroke", "white")
      .on("click", (event, d) => alert(`Clicked on: ${d.data.tag}`));

    const textGroup = svg.append("g")
      .attr("font-family", "arial")
      .attr("font-size", 15)
      .attr("font-weight", 650)
      .attr("text-anchor", "middle");

    textGroup.selectAll("text")
      .data(pieDataStructure)
      .join("text")
      .attr("transform", d =>
        `translate(${arcShapeLabels.centroid(d)[0] * 0.8},${arcShapeLabels.centroid(d)[1] * 0.8})`
      )
      .call(text => text.append("tspan")
        .attr("x", "0")
        .attr("dy", "0em")
        .text(d => d.data.tag)
      )
      .call(text => text.append("tspan")
        .attr("x", "0")
        .attr("dy", "1.2em")
        .text(d => d.data.value + "%")
      );

    this.renderColorPickers(data);
  }

  renderColorPickers(data) {
    const container = this.shadowRoot.querySelector(".color-picker-container");

    container.innerHTML = data.map((d, index) => `
      <div class="color-item">
        <label>${d.tag}</label>
        <input type="color" value="${d.color || this.colorScale(d.tag)}" data-index="${index}">
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
    this.setAttribute("data", JSON.stringify(data));
    this.paths.attr("fill", (d, i) => data[i].color || this.colorScale(d.data.tag));
  }

  get dataValue() {
    return this.#dataValue;
  }

  set dataValue(data){
      this.#dataValue = data;
  }
}

customElements.define("pie-chart", PieChart);
