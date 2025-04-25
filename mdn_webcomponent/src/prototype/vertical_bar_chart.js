function drawVerticalChart(data){
    document.querySelector('#verticalChart').setAttribute('data', JSON.stringify({
        "description": "Single Vertical - Population of countries",
        "width": 400,
        "height": 400,
        
        "data": [{ "values": data.map(d => ({ 
            "country": d.name.value, 
            "population": +d.population.value, 
            "language": d.randomLang.value,
            })) }],
        "encoding": {
            "x": { "field": "country"},
            "y": { "field": "population",
                    "scale": {
                        "type": "log",
                        // "exponent": 0.5
                    }
                },
            "color": { 
                "field": "language",
                // "scale": [ "#c7c7c7", "#aec7e8", "#1f77b4", "#9467bd", "#e7ba52"],
                // "scale": d3.schemePastel1,
                // "scale": d3.schemeSet2,
                // "scale": d3.schemeOrRd[9],
                "scale": {
                    // "domain": ["Belarusian language", "English language", "Romani language", "Persian language"],
                    // "domain": ["Belarusian language", "French language", "لغة تشيلوبا", "Russian language", "English language", "Mongolian language", "Romani language", "Angolar language", "Persian language"],
                    "range": "Reds"
                    // "range": ["#c7c7c7", "#aec7e8"]
                },
                // "scale": d3.interpolateRdYlBu,
                "title": "Language" 
            },
            "direction": "vertical",
        }
    }));
}