📊 SPARQL Visualization Web Components
A modular JavaScript library for visualizing SPARQL query results using reusable Web Components (D3.js-powered). Supports pie charts, bar charts (stacked, grouped, normalized), node-link diagrams, and various map visualizations.

📦 Installation

Install via npm: npm i kgnovis

🚀 Usage

1. Add the bundled script (Or use from CDN after publishing to a public registry.)
<!-- Required bundled script -->
<script type="module" src="dist/kgnovis.bundle.js"></script>

2. Use the custom elements of Web Components in HTML
<bar-chart id="verticalChart"></bar-chart>
<bar-chart id="stackedBarChart"></bar-chart>
<pie-chart id="pieChart"></pie-chart>
<map-chart id="choroplethMap"></map-chart>
<nodelink-chart id="nodeLinkChart"></nodelink-chart>

3. Provide your own data (Vega-Lite inspired format)

<!-- Example for Bar Chart Component -->
✅ Supported Vega-Lite-style fields:
const barChartData = {
  data: [{ category: "A", value: 30 }, { category: "B", value: 70 }],
  encoding: {
    x: { field: "category"},
    y: { field: "value"},
  },
};

drawVerticalChart1(barChartData); // Example usage

📌 Note:
For Bar Chart:
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

✅ Features
📊 Bar Charts: stacked, grouped, normalized; vertical/horizontal

🥧 Pie Charts

🗺 Map Charts: choropleth, bubble, connection arcs, hexbin

🔗 Node-Link Diagrams

🎨 Custom color utils, dynamic updates, transitions

Allow dynamic switching between chart modes via additional fields:

⚠️ Incompatible formats will not be displayed:
Make sure to follow the encoding/markup/data pattern as shown. You can still preprocess data from SPARQL or other APIs into this format before visualization.
