📊 SPARQL Visualization Web Components
A modular JavaScript library for visualizing SPARQL query results using reusable Web Components (D3.js-powered). Supports pie charts, bar charts (stacked, grouped, normalized), node-link diagrams, and various map visualizations.

📦 Installation

Install via npm: npm i @dominhhuy1703/mdn_webcomponent

🚀 Usage

1. Add dependencies (via CDN or copy files locally)
<!-- Required D3 & dependencies -->
<script src="https://d3js.org/d3.v7.min.js"></script>
<script src="https://d3js.org/d3-hexbin.v0.2.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/d3-delaunay@6"></script>
<script src="https://cdn.jsdelivr.net/npm/topojson-client@3"></script>

<!-- Web Components -->
<script src="components/my-component/pie-chart.js"></script>
<script src="components/my-component/bar-chart.js"></script>
<script src="components/my-component/nodelink-chart.js"></script>
<script src="components/my-component/map-chart.js"></script>
<script src="components/my-component/window-chart.js"></script>
<script src="components/my-component/color-utils.js"></script>

2. Use the custom elements in HTML
<bar-chart id="verticalChart1"></bar-chart>
<bar-chart id="stackedBarChart"></bar-chart>
<pie-chart id="pieChart"></pie-chart>
<map-chart id="choroplethMap"></map-chart>
<nodelink-chart id="nodeLinkChart"></nodelink-chart>

3. Provide your own data (Vega-Lite inspired format)

✅ Supported Vega-Lite-style fields:
const barChartData = {
  data: [{ category: "A", value: 30 }, { category: "B", value: 70 }],
  encoding: {
    x: { field: "category"},
    y: { field: "value"}
  },
};

drawVerticalChart1(barChartData); // Example usage

📌 Note:
Format largely follows Vega-Lite bar chart specification

Some enhancements and custom extensions are supported:
  - Support for vertical or horizontal display mode of the chart via "direction" parameter in encoding section:
    + default will be vertical
    + direction = "horizontal" => B
  - Support for stacked, grouped and normalized modes via stack parameter in encoding section:
    + stack = true => type Stacked Bar Chart
    + stack = false => type Grouped Bar Chart
    + stack = "normalize" => Normalized Stacked Bar Chart

Automatically extract scales and domains

Allow dynamic switching between chart modes via additional fields:

⚠️ Incompatible formats will not be displayed:
Make sure to follow the encoding/markup/data pattern as shown. You can still preprocess data from SPARQL or other APIs into this format before visualization.
