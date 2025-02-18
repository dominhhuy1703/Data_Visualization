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
          <style>
              .container {
                  display: flex;
                  gap: 10px;
                  padding: 20px;
              }
                .chart-selector {
                width: 220px;
                padding: 12px;
                border: 2px solid #ccc;
                border-radius: 10px;
                background: #gray;
                box-shadow: 3px 3px 12px rgba(0, 0, 0, 0.15);
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 8px;
                transition: transform 0.2s ease, box-shadow 0.3s ease;
                left: 50%;
                margin-left: 30px;
                margin-top: 30px;
                font-size: 16px;
                }

                .chart-selector:hover {
                transform: scale(1.01);
                box-shadow: 4px 4px 15px rgba(0, 0, 0, 0.25);
                }

                .chart-selector h4 {
                font-size: 20px;
                font-weight: bold;
                }

                .chart-selector label {
                font-size: 18px;
                font-weight: bold;
                color: #333;
                text-align: center;
                }

              button {
                  width: 80%;
                  background: blue;
                  color: white;
                  padding: 10px;
                  border: none;
                  border-radius: 5px;
                  cursor: pointer;
              }
          </style>

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