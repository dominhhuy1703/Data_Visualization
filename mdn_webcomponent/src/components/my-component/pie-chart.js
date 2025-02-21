class PieChart extends HTMLElement {
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
    if (name === "data") {
      this.drawChart();
      this.renderColorPickers();
    }
  }

  render() {
    this.shadowRoot.innerHTML = `
      <link rel="stylesheet" href="components/my-component/my-component.css">
      <div class="container">
        <svg width="400" height="400"></svg>
        <div class="color-picker-container"></div>
      </div>
      
    `;
  }

  drawChart() {
    const svgElement = this.shadowRoot.querySelector("svg");
    const data = JSON.parse(this.getAttribute("data"));
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

    this.renderColorPickers();
  }

  renderColorPickers() {
    const container = this.shadowRoot.querySelector(".color-picker-container");
    const data = JSON.parse(this.getAttribute("data"));

    container.innerHTML = data.map((d, index) => `
      <div class="color-item">
        <label>${d.tag}</label>
        <input type="color" value="${d.color || this.colorScale(d.tag)}" data-index="${index}">
      </div>
    `).join("");

    container.querySelectorAll("input[type='color']").forEach(input => {
      input.addEventListener("input", (event) => this.updateColor(event));
    });
  }

  updateColor(event) {
    const index = event.target.dataset.index;
    const newColor = event.target.value;
    const data = JSON.parse(this.getAttribute("data"));

    data[index].color = newColor;
    this.setAttribute("data", JSON.stringify(data));
    this.paths.attr("fill", (d, i) => data[i].color || this.colorScale(d.data.tag));
  }
}

customElements.define("pie-chart", PieChart);
