function drawVerticalChart1(data){
    document.querySelector('#verticalChart1').setAttribute('data', JSON.stringify({
        "description": "Single Vertical - Population of countries",
        "width": 500,
        "height": 400,
        
        // "data": { 
        //     "values": data.map(d => ({ 
        //         "country": d.name.value, 
        //         "population": +d.population.value, 
        //         "language": d.randomLang.value,
        //     })) },
        "data": { 
            "values": data
        },
        "encoding": {
            "x": { 
                "field": "name",
                // "axis": {
                //     "labelAngle": 45,
                // }
            },
            "y": { "field": "population",
                // "axis": {
                //     "labelAngle": 45,
                // },
                //     "scale": {
                //         "type": "log",
                //         "exponent": 0.5
                //     }
                },
            "color": { 
                "field": "randomLang",
                "scale": {
                    "domain": ["Belarusian language", "English language", "Romani language", "Persian language"],
                    // "domain": ["Belarusian language", "Russian language", "French language", "لغة تشيلوبا", "English language", "Mongolian language", "Romani language", "Angolar language", "Persian language"],
                    "range": "Paired"
                    // "range": d3.schemeOrRd[9]
                    // "range": ["#c7c7c7", "#aec7e8"]
                },
                "title": "Language" 
            },
            "direction": "vertical",
        }
    }));
}