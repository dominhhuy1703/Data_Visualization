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
      .bar-chart svg {
          display: block;
          margin: auto;
      }
      .bar-chart rect {
          transition: fill 0.3s ease, transform 0.3s ease;
      }
      .bar-chart rect:hover {
          fill: darkblue;
      }
      .bar-chart .axis path,
      .bar-chart .axis line {
          stroke: black;
      }
      .bar-chart text {
          font-size: 12px;
          fill: black;
      }
      
      .color-picker-container {
            position: absolute;
            top: 5px;
            left: 10px;
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            background: rgba(255, 255, 255, 0.9);
            padding: 5px;
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
    </style>

    <div class="container">
      <svg width="450" height="350"></svg>
      <div class="color-picker-container"></div>
    </div>
  `;
}


  drawChart() {
    const data = JSON.parse(this.dataValue);
    const svgElement = this.shadowRoot.querySelector('svg');
    const width = 400, height = 350;
    const margin = { top: 20, right: 0, bottom: 40, left: 30 };
    svgElement.innerHTML = '';
    const svg = d3.select(svgElement).attr("width", width).attr("height", height);

    this.colorScale = d3.scaleOrdinal()
      .domain(data.map(d => d.tag))
      .range(["#ff6347", "#4682b4", "#32cd32", "#ffcc00", "#8a2be2", "#9faecd"]);

    const x = d3.scaleBand().domain(data.map(d => d.tag)).range([margin.left, width - margin.right]).padding(0.5);
    const y = d3.scaleLinear().domain([0, d3.max(data, d => d.value)]).nice().range([height - margin.bottom, margin.top]);

    svg.append("g").attr("transform", `translate(0,${height - margin.bottom})`).call(d3.axisBottom(x));
    svg.append("g").attr("transform", `translate(${margin.left},0)`).call(d3.axisLeft(y));

    this.bars = svg.selectAll("rect")
      .data(data)
      .join("rect")
      .attr("x", d => x(d.tag))
      .attr("y", d => y(d.value))
      .attr("height", d => y(0) - y(d.value))
      .attr("width", x.bandwidth())
      .attr("fill", d => d.color || this.colorScale(d.tag));

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
    this.bars.attr("fill", (d, i) => data[i].color || this.colorScale(d.tag));
  }

  get dataValue() {
    return this.#dataValue;
  }

  set dataValue(data){
      this.#dataValue = data;
  }

}

customElements.define('bar-chart', BarChart);