function drawStackedBarChart(data){
    document.querySelector('#stackedBarChart').setAttribute('data', JSON.stringify({
        "description": "Stacked Vertical - Number of films per year",
        "width": 400, 
        "height": 400,
        "data": [{ "values": data.map(d => ({ 
            "year": d.year.value, 
            "count": d.count?.value ? +d.count.value : 0, 
            "genre": d.genre.value,
            })) }],
        "encoding": {
            "x": { "field": "year" },
            "y": { "field": "count" },
            // "y": { "field": "count",
            //         "scale": {
            //             "type": "pow",
            //             "exponent": 0.5
            //         }},
            "color": {
                "field": "genre", 
                "scale": {
                    // "domain": ["Children's television series", "Soap opera", "Drama", "Situation comedy", "Music", "Anthology series", "Traditional pop", "Sitcom", "Adventure", "Historical drama", "Animation", "Comedy"],
                    // "range": d3.schemePaired
                    "range": "Reds[5]"
                },
                // "scale": [ "#c7c7c7", "#aec7e8", "#1f77b4", "#9467bd", "#e7ba52"],
                "title": "Movie genre" 
            },
            "stack": true,
            "direction": "vertical"
        }
    }));
}