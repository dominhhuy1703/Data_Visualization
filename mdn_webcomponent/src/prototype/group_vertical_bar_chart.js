function drawGroupedVerticalChart(data){
    document.querySelector('#groupedVerticalChart').setAttribute('data', JSON.stringify({
        "description": "Grouped Vertical - Number of films per year",
        "width": 500,
        "height": 400,
        "data": {
            "values": data
        },
        "encoding": {
            "x": { "field": "year" },
            "y": { "field": "count" },
            "color": {
                "field": "genre",
                "scale": {
                    // "domain": ["Children's television series", "Soap opera", "Drama", "Situation comedy", "Music", "Anthology series", "Traditional pop", "Sitcom", "Adventure", "Historical drama", "Animation", "Comedy"],
                    // "domain": ["Children's television series", "Drama", "Situation comedy"],
                    "range": "paired"
                    // "range": ["#e7ba52", "#c7c7c7", "#aec7e8"]
                },
                "title": "Movie Genre" 
            },
            "stack": false,
            // "direction": "horizontal"
        }
    }));
}