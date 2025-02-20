class PieChart extends HTMLElement {
  constructor() {
    super();
    this.data = null;
    this.attachShadow({mode: "open"});
  }

  static get observedAttributes() {
    return ['data', 'chart-type'];
  }

  connectedCallback() {
    this.render();
    this.addEventListener('color-change', (event) => this.updateColor(event.detail));
  }

  attributeChangedCallback(name, oldValue, newValue) {
    console.log(`PIE CHART received ${name}:`, newValue);
    this.drawChart();
    this.updateColorPicker();
  }

  render() {
    this.shadowRoot.innerHTML = `
      <link rel="stylesheet" href="components/my-component/my-component.css">
      <color-change target-chart="pie-chart"></color-change>
      <svg width="400" height="400"></svg>
    `;
  }

  drawChart() {
    console.log("Draw piechart with data:", this.getAttribute('data'));
    const svgElement = this.shadowRoot.querySelector('svg');
    const data = JSON.parse(this.getAttribute('data'));
    const width = 400, height = 400;
    const radius = Math.min(width, height) / 2;
    d3.select(svgElement).selectAll("g").remove();

    // Default color
    const colorScale = d3.scaleOrdinal()
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

    // Draw parts of chart
    this.paths = svg.selectAll("path")
      .data(pieDataStructure)
      .join("path")
      .attr("fill", d => d.data.color || colorScale(d.data.tag)) 
      .attr("d", arcShape)
      .attr("stroke", "white")
      .on('click', (event, d) => alert(`Clicked on: ${d.data.tag}`));

    // Add label
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
  }

  updateColorPicker() {
    const colorChangeComponent = this.shadowRoot.querySelector('color-change');
    if (colorChangeComponent) {
        colorChangeComponent.setAttribute('data', this.getAttribute('data'));
    }
  }

  updateColor(updatedData) {
    console.log("Updated colors:", updatedData);
    this.paths.attr("fill", (d, i) => updatedData[i].color);
    this.setAttribute('data', JSON.stringify(updatedData));
  }
}

customElements.define('pie-chart', PieChart);
