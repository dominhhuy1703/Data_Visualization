function drawNormalizedStackedBarChart(data){
    document.querySelector('#normalizedStackedBarChart').setAttribute('data', JSON.stringify({
        "description": "Percentage Stacked - Number of films per year",
        "width": 500,
        "height": 400,
        // stack: "true",
        // direction: "horizontal",
        "data":{
            "values": data
        },
        "encoding": {
            "x": { "field": "year" } ,
            "y": { "field": "count" } ,
            "color": {
                "field": "genre",
                "scale": {
                    // "domain": ["Children's television series", "Soap opera", "Drama", "Situation comedy", "Music", "Anthology series", "Traditional pop", "Sitcom", "Adventure", "Historical drama", "Animation", "Comedy"],
                    "range": "Paired"
                },
                "title": "Movie genre" 
            },
            "stack": "normalize",
            // direction: "horizontal"
        }
    }));
}