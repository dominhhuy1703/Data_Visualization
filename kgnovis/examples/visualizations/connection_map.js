function drawConnectionMap(data) {
    const mapChart = document.querySelector('#connectionMapData');

    // Set configuration
    mapChart.setAttribute("description", "Map Chart - Population of Countries");
    mapChart.setAttribute("width", "600");
    mapChart.setAttribute("height", "600");

    // Set data
    mapChart.setAttribute("data", JSON.stringify(data));
    
    mapChart.setAttribute("url", "https://vega.github.io/vega-datasets/data/us-10m.json");

    mapChart.setAttribute("node",JSON.stringify({
      "url": "https://vega.github.io/vega-datasets/data/airports.csv"
    }));

    mapChart.setAttribute("link",JSON.stringify({
      "url": "https://vega.github.io/vega-datasets/data/flights-airport.csv"
    }));

    mapChart.setAttribute("projection", "albersUsa");

    mapChart.setAttribute("mark", "connective");
    // Set encoding
    mapChart.setAttribute("encoding", JSON.stringify({
        "id": {
            "field": "isoCode"
        },
        "label": {
            "field": "countryLabel",
        },
        "value": {
            "field": "population",
        },
        "color": {
            "field": "population",
            "scale": {
                // "range": d3.schemeOrRd[9]
            },
        },
    }));
    
    mapChart.setAttribute("legend", true );

// function drawConnectionMap(data) {
//     document.querySelector('#connectionMapData').setAttribute('data', JSON.stringify({

//         "$schema": "https://vega.github.io/schema/vega-lite/v6.json",
//         "width": 800,
//         "height": 500,
//         "layer": [
//           {
//             "data": {
//               "url": "https://vega.github.io/vega-datasets/data/us-10m.json",
//               "format": {
//                 "type": "topojson",
//                 "feature": "states"
//               }
//             },
//             "mark": {
//               "type": "geoshape"
//             }
//           },
//           {
//             "data": {
//               "url": "https://vega.github.io/vega-datasets/data/airports.csv"
//             },
//             "mark": "circle",
//             "encoding": {
//               "longitude": {"field": "longitude", "type": "quantitative"},
//               "latitude": {"field": "latitude", "type": "quantitative"}
//             }
//           },
//           {
//             "data": {
//               "url": "https://vega.github.io/vega-datasets/data/flights-airport.csv"
//             },
//             "transform": [
//               {"filter": {"field": "origin", "equal": "SEA"}},
//               {
//                 "lookup": "origin",
//                 "from": {
//                   "data": {"url": "https://vega.github.io/vega-datasets/data/airports.csv"},
//                   "key": "iata",
//                   "fields": ["latitude", "longitude"]
//                 },
//                 "as": ["origin_latitude", "origin_longitude"]
//               },
//               {
//                 "lookup": "destination",
//                 "from": {
//                   "data": {"url": "https://vega.github.io/vega-datasets/data/airports.csv"},
//                   "key": "iata",
//                   "fields": ["latitude", "longitude"]
//                 },
//                 "as": ["dest_latitude", "dest_longitude"]
//               }
//             ],
//             "mark": "rule",
//             "encoding": {
//               "longitude": {"field": "origin_longitude", "type": "quantitative"},
//               "latitude": {"field": "origin_latitude", "type": "quantitative"},
//               "longitude2": {"field": "dest_longitude"},
//               "latitude2": {"field": "dest_latitude"}
//             }
//           }
//         ]
      
//     }));
}