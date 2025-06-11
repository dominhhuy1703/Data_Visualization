function drawChoroplethMap(data) {
    document.querySelector('#choroplethMapData').setAttribute('data', JSON.stringify({
        "description": "Map Chart - Population of Countries",
        "width": 600,
        "height": 600,

        "data": {
            "values": data,
            "url": "https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson",
        },
        "projection": {
            "type": "mercator"
        },
        "mark": "geoshape",
        "encoding": {
            "id": {
                "field": "isoCode"
            },
            "label": {
                "field": "countryLabel"
            },
            "value": {
                "field": "population"
            },
            "color": {
                "field": "population",
                "scale": {
                    // "range": d3.schemeOrRd[9]
                },
            },
            "shape": {
                "field": "geoShape",
                "type": "shape"  // hoặc "geojson"
            },
        }
    }));
}