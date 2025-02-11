/* my-component.js */
class MyComponent extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.selectedTag = "";
    this.isPopupVisible = false;
    this.data = [];
  }

  static get observedAttributes() {
    return ['data', 'width', 'height'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'data') {
      this.data = JSON.parse(newValue);
      this.renderChart();
    }
  }

  connectedCallback() {
    this.render();
    this.renderChart();
  }

  render() {
    this.shadowRoot.innerHTML = `
      <link rel="stylesheet" href="./components/my-component/my-component.css">
      <div class="container">
        <svg class="chart"></svg>
      </div>
      <div class="popup-overlay">
        <div class="popup-content">
          <h3>Your choice:</h3>
          <p class="popup-text"></p>
          <button class="close-btn">Close</button>
        </div>
      </div>
    `;
    this.shadowRoot.querySelector('.close-btn').addEventListener('click', () => this.closePopup());
  }

  renderChart() {
    const svg = this.shadowRoot.querySelector('.chart');
    if (!svg) return;
  
    svg.innerHTML = ''; // Xóa nội dung cũ
  
    const width = 400;
    const height = 400;
    const radius = Math.min(width, height) / 2;
  
    const colorScale = d3.scaleOrdinal()
      .domain(this.data.map(d => d.tag))
      .range(d3.quantize(t => d3.interpolateCool(t * 0.8 + 0.1), this.data.length).reverse());
  
    const arcShape = d3.arc().innerRadius(radius * 0.4).outerRadius(radius - 1);
    const arcShapeLabels = d3.arc().outerRadius(radius - 1).innerRadius(radius * 0.7);
    const pieDataStructure = d3.pie().sort(null).value(d => d.value)(this.data);
  
    const svgElement = d3.select(svg)
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${width / 2}, ${height / 2})`);
  
    // Vẽ biểu đồ
    svgElement.selectAll("path")
      .data(pieDataStructure)
      .join("path")
      .attr("fill", d => colorScale(d.data.tag))
      .attr("d", arcShape)
      .attr("stroke", "white")
      .on('click', (event, d) => this.openPopup(d.data.tag));
  
    // Hiển thị text (tag và value)
    const textGroup = svgElement.append("g")
      .attr("font-family", "sans-serif")
      .attr("font-size", 14)
      .attr("font-weight", 800)
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
        .text(d => d.data.value)
      );
  }
  


  openPopup(tag) {
    this.shadowRoot.querySelector('.popup-text').innerText = tag;
    this.shadowRoot.querySelector('.popup-overlay').style.display = 'flex';
  }

  closePopup() {
    this.shadowRoot.querySelector('.popup-overlay').style.display = 'none';
  }
}

customElements.define('my-component', MyComponent);