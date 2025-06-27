# SPARQL Visualization Web Components
  A JavaScript-based visualization library was developed to support semantic web practitioners and decision-makers in transforming SPARQL query results into meaningful visual representations. The system integrates Vega-Lite grammar for high-level specification of charts and utilizes Web Components to ensure modularity, reusability, and performance across web platforms. The library supports a variety of visual formats including bar charts (regular, stacked, grouped, and percentage), pie charts, and geographical maps (choropleth), all configurable through a JSON-based metadata layer.

## Installation
  **Install via npm**
  ```shell
  npm i kgnovis
  ```

## Usage
  ### 1. Add the bundled script

  Include the script in your HTML (use from local dist folder or CDN after publishing):

  ```html
  <script type="module" src="dist/kgnovis.bundle.js"></script>
  ```
    
  ### 2. Use custom Web Components in HTML
  ```html
  <bar-chart id="verticalChart1"></bar-chart>
  <bar-chart id="stackedBarChart"></bar-chart>
  <pie-chart id="pieChart"></pie-chart>
  <map-chart id="choroplethMap"></map-chart>
  ```
  ### 3. The Chart Configuration
  The library provides components with common properties for each default component as shown in the table below.
  | Property    | Type          | Description                   | Mandatory   |
  |-------------|---------------|------------------------------ |-------------|
  | description | String        | The description of the chart. This will be the title of the visualization and it will be located below the chart.  | ✗          |
  | width       | Number        | The width of the component    | ✗          |
  | height      | Number        | The height of the component   | ✗          |
  | data        | SPARQL Json Object | The input data to be visualized. It is an array of object that each object in the array represents one data point. The input data must conform to the [W3C SPARQL 1.1 Query Results JSON Format](https://www.w3.org/TR/sparql11-results-json/). | ✓  |
  | encoding  | Object    | The encoding property of a single view specification represents the mapping between data and visual variables  | ✓  |
  | legend  | Boolean    | The presence of legend for visualization  | ✗  |
  #### 3.1 Bar Chart
  In the bar chart encoding configuration, the fields provided include:
  | Field    | Type          | Description                   | Value   | Mandatory   |
  |-------------|---------------|------------------------------ |------------|-------------|
  | x | Object        | The specification of x axis for Bar Chart  | | ✓          |
  | y       | Object        | The specification of y axis for Bar Chart    | | ✓          |
  | color      | Object        | The specification color for each bar   |   | ✗          |
  | direction        | String | The orientation of Bar Chart | "vertical" or "horizontal"  | ✗  |
  | stack        | String & Boolean | This attribute is required to define subtypes of Bar Chart including Stacked, Normalized Stacked and Grouped Bar Chart. <br>When the stack is true, then draw Stacked Bar Chart. <br>Else if the stack is "normalize", then draw Normalized Stacked Bar Chart. <br>Else the stack is false, then draw Grouped Bar Chart | true/false or "normalize"  | ✗  |

  In each object, the library provide some properties:
  | Field    | Type          | Description                   | Value   |
  |-------------|---------------|------------------------------ |------------|
  | x | "field":"..."<br>"axis":{"labelAngle": ...}        | The details about the internal structure of object "x". Including:<br>- Attribute "field": The "data" field that the "x" axis maps to.<br>- Attribute "axis": "labelAngle" - inside axis property will allow user to adjust the rotation angle of labelAxis.   | Ex: x: {<br>"field": "name"<br> "axis":{"labelAngle":45}<br>}   |
  | y | "field":"..."<br>"axis":{"labelAngle": ...<br>"scale":{<br> "type":...}<br>}        | The details about the internal structure of object "y". Including:<br>- Attribute "field": The "data" field that the "y" axis maps to<br>- Attribute "axis": <br>+ "labelAngle" - inside axis property will allow user to adjust the rotation angle of labelAxis. <br>+ "scale": inside axis property will permit user to change the scaleType through "type" (Linear, Power, Logarithmic) // Power Scale need one more attribute "exponent" to set     | Ex: y: {<br>"field": "population"<br> "axis":{"labelAngle":45}<br>"scale":{<br>"type":"pow",<br>"exponent":0.5<br>}<br>}   |
  | color | "field":"..."<br>"scale":{<br>"domain": [...],<br>"range":"..."<br>},<br>"title":"..."<br>        | Consist of 5 parts: <br>- The field that "color" attribute will map to the data.<br>- The scale for color including domain (list of domain in the field that be attached color) and range (color palette)<br>- The title for "color" will represent   | Ex: color: {"field":"language"<br>"scale":{<br>"domain": [English,...],<br>"range":"Reds"<br>},<br>"title":"Language"<br>}   |
  ##### 3.1.1 Regular Bar Chart

```html
<bar-chart id="verticalChart1" 
description="..."   
width=500            
height=500
data=[{
  name: "United States", 
  population: 331893745,
  randomLang: "English language"}, {...}]
encoding={
  x: {"field": "name"},
  y: {"field": "population"},
  color: {
    "field": "randomLang",
    "scale": {"domain": ..., "range" ..},
    "title": "Language"
  }
  direction: "vertical"   
}
legend=true
></bar-chart>
```
![Regular Bar Chart](https://raw.githubusercontent.com/dominhhuy1703/Data_Visualization/master/kgnovis/examples/assets/verticalBarChart.png)

##### 3.1.2 Stacked Bar Chart

  
```html
<bar-chart id="stackedBarChart" 
...
data=[{...}, {...}]
encoding={...,
  direction: "vertical",
  stack: true
  }
></barchart>
```

![Stacked Bar Chart](https://raw.githubusercontent.com/dominhhuy1703/Data_Visualization/master/kgnovis/examples/assets/stackBarChart.png)


##### 3.1.3 Normalized Stacked Bar Chart


```html
<bar-chart id="normalizeBarChart" 
...
data=[{...}, {...}]
encoding={...,
  direction: "vertical",
  stack: "normalize"
}
></barchart>
```


![Normalized Bar Chart](https://raw.githubusercontent.com/dominhhuy1703/Data_Visualization/master/kgnovis/examples/assets/normalizedStackBarChart.png)

##### 3.1.4 Grouped Bar Chart

```html
<bar-chart id="groupedBarChart" 
...
data=[{...}, {...}]
encoding={...,
  direction: "vertical",
  stack: false
}
></bar-chart>
```


![Grouped Bar Chart](https://raw.githubusercontent.com/dominhhuy1703/Data_Visualization/master/kgnovis/examples/assets/groupBarChart.png)

#### 3.2 Pie chart
In the Pie Chart encoding configuration, the fields provided include:
  | Field    | Type          | Description                   | Value   | Mandatory   |
  |-------------|---------------|------------------------------ |------------|-------------|
  | text | Object        | The label for each section of visualization  |   | ✓          |
  | theta       | Object        | The quantitative value for each category    |  | ✓          |
  | color      | Object        | The color for each slice   |  | ✓          |
  
  In each object, the library provide some properties:
  | Field    | Type          | Description                   | Value   |
  |-------------|---------------|------------------------------ |------------|
  | text | "field":"..."| The field from data that will map to the label of each section  | Ex: text: {"field": "name"}   |
  | theta | "field":"..."| The field that is the quantitative value for each category  | Ex: theta: {field": "population"} |

  **The way to use the color attribute in the encoding of Pie Chart is similar to Bar Chart.**
```html
<pie-chart id="pieChart"
description="..."
width=500
height=500
data=[{
  name: "United States",
  population: 331893745,
  randomLang: "English language"}, {...}]
encoding={
  text: {"field": "name"},
  theta: {"field": "population"},
  color: {
    "field": "randomLang",
    "scale": {"domain": ..., "range" ...},
    "title": "Language"
  },
legend=true
}
></pie-chart>
```
![Pie Chart](https://raw.githubusercontent.com/dominhhuy1703/Data_Visualization/master/kgnovis/examples/assets/pieChart.png)

#### 3.3 Geographic Map
In the data of Geographic Map configuration, the fields provided include:
  | Field    | Type          | Description                   | Value   | Mandatory   |
  |-------------|---------------|------------------------------ |------------|-------------|
  | values | SPARQL Json Object        | The input data to be visualized. It is an array of object that each object in the array represents one data point. The input data must conform to the [W3C SPARQL 1.1 Query Results JSON Format](https://www.w3.org/TR/sparql11-results-json/)  | Ex: [{...}, {...}]  | ✓          |
  | url       | String        | The URL to a GeoJSON file that contains the geographic features (e.g., country boundaries, regions). This file is used to define the shapes and boundaries on the map. Each feature in the file will be matched with data points from the SPARQL results using the id field. [geoJson File Format](https://geojson.org/)    | Ex: "path/to/world_countries.geojson"  | ✓          |
##### 3.3.1 Choropleth Map
In the encoding of Choropleth Map configuration, the fields provided include:
  | Field    | Type          | Description                   | Value   | Mandatory   |
  |-------------|---------------|------------------------------ |------------|-------------|
  | id | Object        | The id that used for matching the data from geoJson file and SPARQL query's result  | Ex: "id":{<br>"field": "isoCode"<br>}  | ✓          |
  | label       | Object       | A human-readable name that describes the geographic feature represented by the id. This is typically shown in tooltips or legends to provide a meaningful name (e.g., country or region name) instead of a technical identifier.     | Ex: "label":{<br>"field": "countryName"<br>}  | ✓  |
  | color       | Object       | This field will color the regions based on data from the SPARQL query's result    | Ex: "color":{<br>"field": "population"<br>}  | ✓          |

  In each object, the library provide some properties:
  | Field    | Type          |Description          | Value   |
  |-------------|---------------|---------------|------------------------------ |
  | id | "field":"..."  | The id is used for matching the data from geoJson file and SPARQL query's result. This attribute comes from the geoJson file.  | Ex: id: {"field": "isoCode"}   |
  | label | "field":"..."| The name of the label, which provides additional details for describing the id     | Ex: label: {field": "countryName"}   |
  | color | "field":"..."<br>"scale":{"range":"..."<br>}| The field that "color" attribute will map to the data. The scale for color including range (color palette)| Ex: color: {"field":"population",<br>"scale":{"range":"Reds"<br>}}   |

  **The way to use the color part in the encoding of Geographic Map is similar to bar chart.**
```html
<map-chart id="choroplethMap"
description="..."
width=500
height=500
data={
  values=[{
    isoCode: "USA",
    population: 340110988,
    countryLabel: "United States"}, {...}],
  url="..."
encoding={
  id: {"field": "isoCode"},
  label: {"field": "countryLabel"},
  color: {
    "field": "population",
    "scale": {"range": ...},
  },
  }
></map-chart>
```

![Choropleth Map](https://raw.githubusercontent.com/dominhhuy1703/Data_Visualization/master/kgnovis/examples/assets/choroplethMap.png)