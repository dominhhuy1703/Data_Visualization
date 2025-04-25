function drawChoroplethMap(data) {
    document.querySelector('#choroplethMapData').setAttribute('data', JSON.stringify({
        "description": "Map Chart - Population of Countries",
        "width": 600,
        "height": 600,
        // "bubble": "true",

        "data": {
            "url": "https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson",
            // "format": {
            // "type": "topojson",
            // "feature": "countries"
            // }
        },
        "transform": [
            {
            "lookup": "id",
            "from": {
                "data": {
                "values": data.map(d => ({
                    "id": d.isoCode.value,
                    "country": d.countryLabel.value,
                    "population": +d.population.value
                }))
                },
                "key": "id",
                "fields": ["population", "country"]
            }
            }
        ],
        "projection": {
            "type": "mercator"
        },
        "mark": "geoshape",
        "encoding": {
            "color": {
            "field": "population",
            "type": "quantitative"
            },
        }
    }));
}