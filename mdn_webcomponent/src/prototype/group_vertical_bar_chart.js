function drawGroupedVerticalChart(data){
    document.querySelector('#groupedVerticalChart').setAttribute('data', JSON.stringify({
        "description": "Grouped Vertical Bar Chart",
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
            "color": {
                "field": "genre",
                "scale": {
                    "domain": ["Children's television series", "Soap opera", "Drama", "Situation comedy", "Music", "Anthology series", "Traditional pop", "Sitcom", "Adventure", "Historical drama", "Animation", "Comedy"],
                    "range": d3.schemePaired
                },
                // "scale": ["#e7ba52", "#c7c7c7", "#aec7e8"],
                "title": "Movie Genre" 
            },
            "stack": false,
            // "direction": "horizontal"
        }
    }));
}