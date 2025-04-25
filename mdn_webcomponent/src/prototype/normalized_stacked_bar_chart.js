function drawNormalizedStackedBarChart(data){
    document.querySelector('#normalizedStackedBarChart').setAttribute('data', JSON.stringify({
        "description": "Percentage Stacked - Number of films per year",
        "width": 400,
        "height": 400,
        // stack: "true",
        // direction: "horizontal",
        "data": [{ "values": data.map(d => ({ 
            "year": d.year.value, 
            "count": d.count?.value ? +d.count.value : 0, 
            "genre": d.genre.value,
            })) }],
        "encoding": {
            "x": { "field": "year" } ,
            "y": { "field": "count" } ,
            "color": {
                "field": "genre",
                "scale": {
                    "domain": ["Children's television series", "Soap opera", "Drama", "Situation comedy", "Music", "Anthology series", "Traditional pop", "Sitcom", "Adventure", "Historical drama", "Animation", "Comedy"],
                    "range": d3.schemePaired
                },
                "title": "Movie genre" 
            },
            "stack": "normalize",
            // direction: "horizontal"
        }
    }));
}