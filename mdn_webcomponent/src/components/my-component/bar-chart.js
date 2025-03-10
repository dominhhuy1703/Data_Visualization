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
          :host { display: block; width: 100%; height: 100%; position: relative; }
          .container { display: flex; justify-content: center; align-items: center; width: 100%; height: 100%; position: relative; }
          .bar-chart svg { display: block; margin: auto; }
          .popup { display: none; position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; padding: 20px; border-radius: 10px; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3); z-index: 1000; }
          .popup.show { display: block; }
          .overlay { display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.5); z-index: 999; }
          .overlay.show { display: block; }
          .color-picker-container { display: flex; flex-direction: column; }
          .color-item { display: flex; align-items: center; font-size: 14px; margin-bottom: 5px; }
          .color-item label { min-width: 100px; font-weight: bold; }
          .color-item input { width: 35px; height: 35px; border: none; cursor: pointer; }
          .change-color-btn { position: absolute; top: 10px; right: 10px; padding: 8px 12px; background: #007bff; color: white; border: none; cursor: pointer; border-radius: 5px; font-weight: bold; }
          .change-color-btn:hover { background: #0056b3; }
          .close-popup { margin-top: 10px; padding: 8px 12px; background: #dc3545; color: white; border: none; cursor: pointer; border-radius: 5px; font-weight: bold; }
          .close-popup:hover { background: #c82333; }
        </style>
        <div class="container">
          <svg width="500" height="500"></svg>
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
      const data = JSON.parse(this.#dataValue);
      const svgElement = this.shadowRoot.querySelector('svg');
      const width = 500, height = 450;
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
        .attr("fill", d => d.color || this.colorScale(d.tag))
        .on("click", (event, d) => this.showPopup(d))
        .append("title")
        .text(d => `${d.tag}: ${d.value}`);
  
      // Add text labels inside each bar
      svg.selectAll(".bar-value")
        .data(data)
        .join("text")
        .attr("class", "bar-value")
        .attr("x", d => x(d.tag) + x.bandwidth() / 2)  
        .attr("y", d => y(d.value) - 10)  
        .attr("text-anchor", "middle")
        .attr("fill", "black")
        .attr("font-size", "14px")
        .text(d => d.value);
  
      this.renderColorPickers(data);
    }
  
    showPopup(d) {
      const popup = this.shadowRoot.querySelector(".popup");
      const overlay = this.shadowRoot.querySelector(".overlay");
  
      // Update popup content with bar information
      popup.innerHTML = `
        <div>Tag: ${d.tag}</div>
        <div>Value: ${d.value}</div>
        <button class="close-popup">Close</button>
      `;
      
      this.togglePopup(true);
      this.shadowRoot.querySelector(".close-popup").addEventListener("click", () => this.togglePopup(false));
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
      this.bars.data(data).attr("fill", d => d.color || this.colorScale(d.tag));
    }
  
    get dataValue() {
      return this.#dataValue;
    }
  
    set dataValue(data) {
      this.#dataValue = data;
    }
  }
  
  customElements.define('bar-chart', BarChart);
  