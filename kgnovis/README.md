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
  ### 3. The configuration charts
  The library provides components with common properties for each default component as shown in the table below.
  | Property    | Type          | Description                   | Mandatory   |
  |-------------|---------------|------------------------------ |-------------|
  | description | String        | The description of the chart  | ✗          |
  | width       | Number        | The width of the component    | ✗          |
  | height      | Number        | The height of the component   | ✗          |
  | data        | SPARQL Json Object | The input data to be visualized. It is an array of object that each object in the array represents one data point. | ✓  |
  | encoding  | Object    | The encoding property of a single view specification represents the mapping between data and visual variables  | ✓  |
  | legend  | Boolean    | The presence of legend for visualization  | ✗  |
  #### 3.1 Bar Chart
  In the bar chart encoding configuration, the fields provided include:
  | Field    | Type          | Description                   | Value   | Mandatory   |
  |-------------|---------------|------------------------------ |------------|-------------|
  | x | Object        | The specification of x axis for Bar Chart  | Ex: {...}  | ✓          |
  | y       | Object        | The specification of y axis for Bar Chart    | Ex: {...}  | ✓          |
  | color      | Object        | The specification color for each bar   | Ex: {...}  | ✗          |
  | direction        | String | The orientation of Bar Chart | "vertical" or "horizontal"  | ✗  |
  | stack        | String & Boolean | The subtypes of Bar Chart including Stacked, Normalized Stacked and Grouped Bar Chart. <br>When the stack is true, then draw Stacked Bar Chart. <br>Else if the stack is "normalize", then draw Normalized Stacked Bar Chart. <br>Else the stack is false, then draw Grouped Bar Chart | true/false or "normalize"  | ✗  |

  In each object, the library provide some properties:
  | Field    | Type          | Description                   | Value   |
  |-------------|---------------|------------------------------ |------------|
  | x | "field":"..."<br>"axis":{"labelAngle": ...}        | The field that "x" axis will map to the data  | Ex: x: {<br>"field": "name"<br> "axis":{"labelAngle":45}<br>}   |
  | y | "field":"..."<br>"axis":{"labelAngle": ...}        | The field that "y" axis will map to the data  | Ex: y: {<br>"field": "population"<br> "axis":{"labelAngle":45}<br>}   |
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

| Field    | Value   | Mandatory   |
  |-------------|---------------|------------------------------ |
  | color      | |✓  |
  | stack        | true | ✓  |
  
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

| Field    | Value   | Mandatory   |
  |-------------|---------------|------------------------------ |
  | color      | |✓  |
  | stack        | "normalize" | ✓  |

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
| Field    | Value   | Mandatory   |
  |-------------|---------------|------------------------------ |
  | color      | |✓  |
  | stack        | false | ✓  |

```html
<bar-chart id="groupedBarChart" 
...
data=[{...}, {...}]
encoding={...,
  direction: "vertical",
  stack: false
}
></barchart>
```


![Grouped Bar Chart](https://raw.githubusercontent.com/dominhhuy1703/Data_Visualization/master/kgnovis/examples/assets/groupBarChart.png)

#### 3.2 Pie chart
In the Pie Chart encoding configuration, the fields provided include:
  | Field    | Type          | Description                   | Value   | Mandatory   |
  |-------------|---------------|------------------------------ |------------|-------------|
  | text | Object        | The label for each section of visualization  | Ex: {...}  | ✓          |
  | theta       | Object        | The quantitative value for each category    | Ex: {...}  | ✓          |
  | color      | Object        | The color for each slice   | Ex: {...}  | ✓          |
  
  In each object, the library provide some properties:
  | Field    | Type          | Description                   | Value   |
  |-------------|---------------|------------------------------ |------------|
  | text | "field":"..."| The field that text from data will map to the label of each section  | Ex: text: {"field": "name"}   |
  | theta | "field":"..."| The field that is the quantitative value for each category  | Ex: theta: {field": "population"} |

  **The way to use the color part in the encoding of Pie Chart is similar to Bar Chart.**
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
  | values | SPARQL Json Object        | The input data to be visualized. It is an array of object that each object in the array represents one data point.  | Ex: [{...}, {...}]  | ✓          |
  | url       | String        | The link of geoJson's file    | Ex: "...geojson"  | ✓          |
##### 3.3.1 Choropleth Map
In the encoding of Choropleth Map configuration, the fields provided include:
  | Field    | Type          | Description                   | Value   | Mandatory   |
  |-------------|---------------|------------------------------ |------------|-------------|
  | id | Object        | The id that used for matching the data from geoJson file and SPARQL query's result  | Ex: {...}  | ✓          |
  | label       | Object       | The name of the label, which provides additional details for describing the id     | Ex: {...}  | ✓  |
  | color       | Object       | This field will color the regions based on data from the SPARQL query's result    | Ex: {...}  | ✓          |

  In each object, the library provide some properties:
  | Field    | Type          |Description          | Value   |
  |-------------|---------------|---------------|------------------------------ |
  | id | "field":"..."  | The id that used for matching the data from geoJson file and SPARQL query's result  | Ex: id: {"field": "isoCode"}   |
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
  value: {"field": "population"},
  color: {
    "field": "population",
    "scale": {"range": ...},
  },
  }
></map-chart>
```

![Choropleth Map](https://raw.githubusercontent.com/dominhhuy1703/Data_Visualization/master/kgnovis/examples/assets/choroplethMap.png)