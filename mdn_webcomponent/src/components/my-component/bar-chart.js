class BarChart extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  static get observedAttributes() {
    return ['data'];
  }

  connectedCallback() {
    this.render();
  }

  attributeChangedCallback(name, oldValue, newValue) {
      console.log(`bar-chart received ${name}:`, newValue);
      this.drawChart();
  }

  render() {
    this.shadowRoot.innerHTML = `
    <svg width="450" height="400"></svg>`;
  }

  drawChart() {
    const data = JSON.parse(this.getAttribute('data'));
    const svgElement = this.shadowRoot.querySelector('svg');
    const width = 450, height = 300;
    const margin = { top: 20, right: 0, bottom: 40, left: 70 };
    svgElement.innerHTML = '';
    const svg = d3.select(svgElement).attr("width", width).attr("height", height);

    const x = d3.scaleBand().domain(data.map(d => d.tag)).range([margin.left, width - margin.right]).padding(0.5);
    const y = d3.scaleLinear().domain([0, d3.max(data, d => d.value)]).nice().range([height - margin.bottom, margin.top]);

    svg.append("g").attr("transform", `translate(0,${height - margin.bottom})`).call(d3.axisBottom(x));
    svg.append("g").attr("transform", `translate(${margin.left},0)`).call(d3.axisLeft(y));

    svg.selectAll("rect")
      .data(data)
      .join("rect")
      .attr("x", d => x(d.tag))
      .attr("y", d => y(d.value))
      .attr("height", d => y(0) - y(d.value))
      .attr("width", x.bandwidth())
      .attr("fill", (d, i) => ["#ff6347", "#4682b4", "#32cd32", "#ffcc00", "#8a2be2", "#9faecd"][i % 6]);
  }
}

customElements.define('bar-chart', BarChart);