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

        .container {
          display: flex; 
          justify-content: center; 
          align-items: center; 
          width: 100%; 
          height: 100%; 
          position: relative; 
        }

        .pie-chart-container { 
          display: flex; 
          flex-direction: column; 
          align-items: center; 
          justify-content: center; 
          padding: 20px; 
        }

        .pie-chart svg { 
          width: 450px; 
          height: 450px; 
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
      </style>
      <div class="container">
        <svg width="400" height="400"></svg>
        <div class="tooltip"></div>
        <button class="change-color-btn">Change Color</button>
        <div class="overlay"></div>
        <div class="popup">
          <div class="color-picker-container"></div>
          <button class="close-popup">Close</button>
        </div>
      </div>
    `;
    this.shadowRoot.querySelector(".change-color-btn").addEventListener("click", () => this.togglePopup(true));
    this.shadowRoot.querySelector(".close-popup").addEventListener("click", () => this.togglePopup(false));
    this.shadowRoot.querySelector(".overlay").addEventListener("click", () => this.togglePopup(false));
  }


  togglePopup(show) {
    const popup = this.shadowRoot.querySelector(".popup");
    popup.classList.toggle("show", show);
  }

  drawChart() {
    const svgElement = this.shadowRoot.querySelector("svg");
    const tooltip = this.shadowRoot.querySelector(".tooltip");
    let data = JSON.parse(this.#dataValue);
    const width = 400, height = 400;
    const radius = Math.min(width, height) / 2;
    d3.select(svgElement).selectAll("g").remove();

    this.colorScale = d3.scaleOrdinal()
      .domain(data.map(d => d.tag))
      .range(["#ff6347", "#4682b4", "#32cd32", "#ffcc00", "#8a2be2", "#9faecd"]);

    const arcShape = d3.arc().innerRadius(radius * 0.4).outerRadius(radius - 0.9);
    const arcShapeLabels = d3.arc().outerRadius(radius - 0.85).innerRadius(radius * 0.6);
    const pieDataStructure = d3.pie().sort(null).value(d => d.value)(data);
    const svg = d3.select(svgElement).append("g").attr("transform", `translate(${width / 2}, ${height / 2})`);

    this.paths = svg.selectAll("path")
      .data(pieDataStructure)
      .join("path")
      .attr("fill", d => d.data.color || this.colorScale(d.data.tag))
      .attr("d", arcShape)
      .attr("stroke", "white")
      .on("click", (event, d) => alert(`Clicked on: ${d.data.tag}, ${d.data.value}`))
      .on("mouseover", (event, d) => {
        tooltip.style.opacity = 1;
        tooltip.innerHTML = `<strong>${d.data.tag}</strong>: ${d.data.value.toFixed(1)}`;
        d3.select(event.target).style("stroke", "black").style("opacity", 1);
      })
      .on("mousemove", (event) => {
        tooltip.style.left = `${event.pageX + 10}px`;
        tooltip.style.top = `${event.pageY - 10}px`;
      })
      .on("mouseout", (event) => {
        tooltip.style.opacity = 0;
        d3.select(event.target).style("stroke", "white").style("opacity", 1);
      });

    const textGroup = svg.append("g")
      .attr("font-family", "arial")
      .attr("font-size", 15)
      .attr("font-weight", 650)
      .attr("text-anchor", "middle");

    textGroup.selectAll("text")
      .data(pieDataStructure)
      .join("text")
      .attr("transform", d => {
        const centroid = arcShapeLabels.centroid(d);
        return d.data.value < 5 ? `translate(${centroid[0] * 1.5},${centroid[1] * 1.5})` : `translate(${centroid[0] * 0.8},${centroid[1] * 0.8})`;
      })
      .call(text => text.append("tspan").attr("x", "0").attr("dy", "0em").text(d => d.data.tag))
      .call(text => text.append("tspan").attr("x", "0").attr("dy", "1.2em").text(d => d.data.value));

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
    this.paths.data(data).attr("fill", d => d.color || this.colorScale(d.data.tag));
  }

  get dataValue() {
    return this.#dataValue;
  }

  set dataValue(data) {
    this.#dataValue = data;
  }
}

customElements.define("pie-chart", PieChart);