function drawVerticalChart2(data){
    document.querySelector('#verticalChart2').setAttribute('data', JSON.stringify({
        "description": "Single Vertical - Population of countries",
        "width": 500,
        "height": 400,
        "data": { 
            "values": data
        },
        "encoding": {
            "x": { "field": "name"},
            "y": { "field": "population",
                    // "scale": {
                    //     "type": "log",
                    //     "exponent": 0.5
                    // }
                },
            "color": { 
                "field": "randomLang",
                "scale": {
                    // "domain": ["Belarusian language", "English language", "Romani language", "Persian language"],
                    "domain": ["Belarusian language", "aaa", "Russian language", "French language", "لغة تشيلوبا", "English language", "Mongolian language", "Romani language", "Angolar language", "Persian language"],
                    "range": "Reds"
                    // "range": ["#c7c7c7", "#aec7e8"]
                },
                // "scale": d3.interpolateRdYlBu,
                "title": "Language" 
            },
            "direction": "horizontal",
        }
    }));
}