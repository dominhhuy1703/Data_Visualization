function drawChoroplethMap(data) {
    const mapChart = document.querySelector('#choroplethMapData');

    // Set configuration
    mapChart.setAttribute("description", "Map Chart - Population of Countries");
    mapChart.setAttribute("width", "600");
    mapChart.setAttribute("height", "500");

    // Set data
    mapChart.setAttribute("data", JSON.stringify(data));
    console.log("data", data)
    mapChart.setAttribute("projection", "mercator");

    // Set encoding
    mapChart.setAttribute("encoding", JSON.stringify({
        "id": {
            "field": "isoCode"
        },
        "label": {
            "field": "country",
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