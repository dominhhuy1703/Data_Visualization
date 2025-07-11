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
  | color      | Object        | The specification color for each bar. See [3.4 - Color Palettes](#34-color-palettes) for full usage and supported values.    |   | ✗<br> (✓ Required for subtypes of Bar Chart including Stacked, Normalized Stacked and Grouped Bar Chart)          |
  | direction        | String | The orientation of Bar Chart | "vertical" or "horizontal"  | ✗   |
  | stack        | String & Boolean | This attribute is required to define subtypes of Bar Chart including Stacked, Normalized Stacked and Grouped Bar Chart. <br>  - When the stack is true, then draw Stacked Bar Chart. <br>  - Else if the stack is "normalize", then draw Normalized Stacked Bar Chart. <br>  - Else the stack is false, then draw Grouped Bar Chart | true/false or "normalize"  | ✗  |

  In each object, the library provide some properties:
  | Field    | Type          | Description                   | Value   |
  |-------------|---------------|------------------------------ |------------|
  | x | "field":"..."<br>"axis":{"labelAngle": ...}        | The details about the internal structure of object "x". Including:<br>- Attribute "field": The "data" field that the "x" axis maps to.<br>- Attribute "axis": "labelAngle" - inside axis property will allow user to adjust the rotation angle of labelAxis.   | Ex: x: {<br>"field": "name"<br> "axis":{"labelAngle":45}<br>}   |
  | y | "field":"..."<br>"axis":{"labelAngle": ...<br>"scale":{<br> "type":...}<br>}        | The details about the internal structure of object "y". Including:<br>- Attribute "field": The "data" field that the "y" axis maps to<br>- Attribute "axis": <br>  + "labelAngle" - inside axis property will allow user to adjust the rotation angle of labelAxis. <br>  + "scale": inside axis property will permit user to change the scaleType through "type" (Linear, Power, Logarithmic) // Power Scale need one more attribute "exponent" to set     | Ex: y: {<br>"field": "population"<br> "axis":{"labelAngle":45}<br>"scale":{<br>"type":"pow",<br>"exponent":0.5<br>}<br>}   |

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
  | Field    | Type          | Description                   |  Mandatory   |
  |-------------|---------------|------------------------------ |------------|
  | text | Object        | The label for each section of visualization  | ✗          |
  | theta       | Object        | The quantitative value for each category    | ✓          |
  | color      | Object        | The color for each slice. See [3.4 - Color Palettes](#34-color-palettes) for full usage and supported values.  | ✓          |
  
  In each object, the library provide some properties:
  | Field    | Type          | Description                   | Value   |
  |-------------|---------------|------------------------------ |------------|
  | text | "field": "..."| The field from data that will map to the label of each section  | Ex: text: {"field": "name"}   |
  | theta | "field": "..."| The field that is the quantitative value for each category  | Ex: theta: {field": "population"} |

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

#### 3.3 Geographic Map (Choropleth Map)
In the encoding of Choropleth Map configuration, the fields provided include:
  | Field    | Type          | Description                   |  Mandatory   |
  |-------------|---------------|------------------------------ |------------|
  | id | Object        | The id that used for matching the data from geoJson file and SPARQL query's result  |  ✓          |
  | label       | Object       | A human-readable name that describes the geographic feature represented by the id. This is typically shown in tooltips or legends to provide a meaningful name (e.g., country or region name) instead of a technical identifier.     |  ✗  |
  | geometry       | Object       | Data from the geoJSON file, must be processed during querying to retrieve GeoJSON geometry data for each entity.     |  ✓  |
  | color       | Object       | This field will color the regions based on data from the SPARQL query's result. See [3.4 - Color Palettes](#34-color-palettes) for full usage and supported values. |  ✓          |

  In each object, the library provide some properties:
  | Field    | Type          |Description          | Value   |
  |-------------|---------------|---------------|------------------------------ |
  | id | "field":"..."  | The id is used for matching the data from geoJSON file and SPARQL query's result. This attribute comes from the geoJSON file.  | Ex: id: {"field": "isoCode"}   |
  | label | "field":"..."| The field from data that map to name of the label, which provides additional details for describing the id     | Ex: label: {field": "countryName"}   |
  | geometry | "field":"..."| The field from data that contains GeoJSON geometry data for each entity (polygon, contour line…). Used for map display.    | Ex: geometry: {field": "geoJSON"}   |

```html
<map-chart id="choroplethMap"
description="..."
width=500
height=500
data=[{
    isoCode: "USA",
    population: 340110988,
    countryLabel: "United States"
    geoJSON: {...}}, {...}],
encoding={
  id: {"field": "isoCode"},
  label: {"field": "countryLabel"},
  geometry: {"field": "geoJSON"},
  color: {
    "field": "population",
    "scale": {"range": ...},
  },
  }
></map-chart>
```

![Choropleth Map](https://raw.githubusercontent.com/dominhhuy1703/Data_Visualization/master/kgnovis/examples/assets/choroplethMap.png)

#### 3.4 Color Palettes
The "color" property is an important property for most types of charts today. This module provides sequential, divergent, and categorical color schemes designed to work with color palettes from the D3.js library. Most of these schemes are derived from ColorBrewer by Cynthia A. Brewer.

**Improvements over D3.js library**
To provide flexibility and ease of use when customizing chart colors, the library includes a powerful color palette parsing function. This feature allows users to define palettes using intuitive string inputs, which are automatically mapped to their corresponding color schemes in the D3.js library [D3 Color Palettes](https://d3js.org/d3-scale-chromatic)


##### 3.4.1 Operation principle
Users can apply color schemes by simply providing a string. The system automatically maps the string to the appropriate D3 color palette.

***How to use***
- "PaletteName" → Maps to d3.interpolatePaletteName (for continuous gradients) or d3.schemePaletteName (for discrete categories).
- "PaletteName[k]" → Maps to d3.schemePaletteName[k], where k defines the number of colors (if supported)
- You can also directly specify an array of color codes as a custom palette:
    ```javascript
    "range": ["#ff0000", "#00ff00", "#0000ff"]
    ```
Below are examples for use with each type of color palette.
###### 3.4.1.1 Categorical Palettes *(Discrete)*
Used to differentiate distinct groups or categories.
  - "Category10" → d3.schemeCategory10
  ![Ex1-Color Palettes](https://raw.githubusercontent.com/dominhhuy1703/Data_Visualization/master/kgnovis/examples/assets/category10.jpg)
  - "Pastel1" → d3.schemePastel1 
  ![Ex2-Color Palettes](https://raw.githubusercontent.com/dominhhuy1703/Data_Visualization/master/kgnovis/examples/assets/pastel1.jpg)
###### 3.4.1.2 Sequential Palettes *(Ordered)*
Best for representing ranked or continuous data (e.g., values, density).
  - "Reds[5] → d3.schemeReds[5] (5 shades of red), valid k ∈ [3, 11]
  ![Ex3-Color Palettes](https://raw.githubusercontent.com/dominhhuy1703/Data_Visualization/master/kgnovis/examples/assets/schemeReds.png)
  - "Blues" → d3.interpolateBlues (smooth blue gradient)
  ![Ex4-Color Palettes](https://raw.githubusercontent.com/dominhhuy1703/Data_Visualization/master/kgnovis/examples/assets/interpolateBlues.png)
###### 3.4.1.3 Diverging Palettes *(Centered Scales)*
Ideal for data with a meaningful midpoint (e.g., gain vs. loss).
  - "RdYlBu" → d3.interpolateRdYlBu (red → yellow → blue)
  ![Ex5-Color Palettes](https://raw.githubusercontent.com/dominhhuy1703/Data_Visualization/master/kgnovis/examples/assets/RdYlBu.png)
  - "Spectral[9]" → d3.schemeSpectral[9], valid k ∈ [3, 11]
  ![Ex6-Color Palettes](https://raw.githubusercontent.com/dominhhuy1703/Data_Visualization/master/kgnovis/examples/assets/spectral.png)
###### 3.4.1.4 Cyclical Palettes *(Repeating Patterns)*
  - "Rainbow" → d3.interpolateRainbow
  ![Ex7-Color Palettes](https://raw.githubusercontent.com/dominhhuy1703/Data_Visualization/master/kgnovis/examples/assets/rainbow.png)
  
##### 3.4.2 Color Configuration
| Property    | Type          | Description                      |
|-------------|---------------|------------------------------|
| field | String        | The field from "data" that will bind with "color"   |
| → domain      | Array        | List of distinct values ​​that exist in the data (for categorical data). Optional for continuous values.    |
| → range      | String or Array       | The color palette name (e.g., "Reds", "Blues", "Viridis"). Or a custom array of color codes (e.g., ["#ff0000", "#00ff00", "#0000ff"]). |
| title      | String        | 	(Optional) Title shown in the legend to describe what the colors represent.|

***Example***
- For predefined palette:
```javascript
"color": {
  "field": "population",
  "scale": {
    "range": "Reds"
  },
  "title": "Population"
}
```
- For categorical with domain:
```javascript
"color": {
  "field": "language",
  "scale": {
    "domain": ["English", "Spanish", "French"],
    "range": "Category10"
  },
  "title": "Language"
}
```
- For custom array of color codes:
```javascript
"color": {
  "field": "region",
  "scale": {
    "domain": ["North", "Central", "South"],
    "range": ["#f94144", "#f3722c", "#90be6d"]
  },
  "title": "Region"
}
```