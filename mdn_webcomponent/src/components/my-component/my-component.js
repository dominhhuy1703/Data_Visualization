class MyComponent extends HTMLElement {
  constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this.render();
  }

  static get observedAttributes() {
      return ['data', 'nodelink-data'];
  }

  connectedCallback() {
  }

  attributeChangedCallback() {
      this.render();
      
  }

  render() {
      this.shadowRoot.innerHTML = `
          <link rel="stylesheet" href="components/my-component/my-component.css">
          
          <div class="chart-selector">
              <h4>Select Chart</h4>
              <label><input type="radio" name="chartType" value="pie-chart" checked> Pie Chart</label><br>
              <label><input type="radio" name="chartType" value="bar-chart"> Bar Chart</label><br>
              <label><input type="radio" name="chartType" value="nodelink-chart"> Node Link</label><br>
              <label><input type="radio" name="chartType" value="map-chart"> Map Chart</label><br>
              <button id="run">Run</button>
          </div>
      `;

      const runButton = this.shadowRoot.querySelector('#run');
      runButton.addEventListener('click', () => this.updateChart());
  }

  updateChart() {
    const selectedChart = this.shadowRoot.querySelector('input[name="chartType"]:checked').value;
    let windowChart = document.createElement('window-chart')
    if (selectedChart == 'nodelink-chart'){
      windowChart.setAttribute('data', this.getAttribute('nodelink-data'));
    }
    else {
      windowChart.setAttribute('data', this.getAttribute('data'));
    }
    windowChart.setAttribute('chart-type', selectedChart);
    this.shadowRoot.append(windowChart);
    // Show chart's window
    windowChart.classList.add('show');
  }
}

customElements.define('my-component', MyComponent);