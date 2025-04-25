function drawConnectionMap(data) {
    document.querySelector('#connectionMapData').setAttribute('data', JSON.stringify({
        "description": "Map Chart - Population of Countries",
        "width": 1000,
        "height": 600,
        // "bubble": "true",
        "connection": "true",

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