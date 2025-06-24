function drawHexbinMap(data) {
    const mapChart = document.querySelector('#hexbinMapData');

    // Set configuration
    mapChart.setAttribute("description", "Map Chart - Population of Countries");
    mapChart.setAttribute("width", "600");
    mapChart.setAttribute("height", "600");

    // Set data
    mapChart.setAttribute("data", JSON.stringify({ 
        "values": data,
        "url": "https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson",
     }));
    console.log("Data", data)

    mapChart.setAttribute("projection", "mercator");

    mapChart.setAttribute("mark", "hexbin");
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
}