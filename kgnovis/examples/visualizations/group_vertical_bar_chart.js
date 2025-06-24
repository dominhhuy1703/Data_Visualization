function drawGroupedVerticalChart(data){
    const barChart = document.querySelector('#groupedVerticalChart');

    // Set configuration
    barChart.setAttribute("description", "Stacked Vertical - Number of films per year");
    barChart.setAttribute("width", "500");
    barChart.setAttribute("height", "400");
        
    // Set data
    barChart.setAttribute("data", JSON.stringify(data));

    // Set encoding
    barChart.setAttribute("encoding", JSON.stringify({
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
                "range": "Category10"
            },
            // "scale": [ "#c7c7c7", "#aec7e8", "#1f77b4", "#9467bd", "#e7ba52"],
            "title": "Movie genre" 
        },
        "stack": false,
        "direction": "vertical"
    }));
    barChart.setAttribute("legend", true);
}