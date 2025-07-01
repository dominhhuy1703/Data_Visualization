function drawChoroplethMap(data) {
    const mapChart = document.querySelector('#choroplethMapData');

    // Set configuration
    mapChart.setAttribute("description", "Map Chart - Population of Countries");
    mapChart.setAttribute("width", "600");
    mapChart.setAttribute("height", "600");

    // Set data
    mapChart.setAttribute("data", JSON.stringify(data));
    console.log("DATAAAAAAAAAAAA", data)
    mapChart.setAttribute("url", "https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson");
    
    mapChart.setAttribute("projection", "mercator");

    mapChart.setAttribute("mark", "geoShape");
    // Set encoding
    mapChart.setAttribute("encoding", JSON.stringify({
        "id": {
            "field": "isoCode"
        },
        "label": {
            "field": "country",
        },
        "value": {
            "field": "population",
        },
        "geometry": {
            "field": "geoJSON",
        },
        "color": {
            "field": "population",
            "scale": {
                // "range": d3.schemeOrRd[9]
            },
        // "projection": {"fieldt": "mercator")}; //Put the "projection" into the encoding
        },
    }));
    
    mapChart.setAttribute("legend", true );
}