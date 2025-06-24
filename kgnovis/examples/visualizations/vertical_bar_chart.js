function drawVerticalChart1(data) {
    console.log("rawDataa:", data);
    const barChart = document.querySelector('#verticalChart1');
    
    // Set configuration
    barChart.setAttribute("description", "Single Vertical - Population of countries");
    barChart.setAttribute("width", "500");
    barChart.setAttribute("height", "500");

    // Set data
    barChart.setAttribute("data", JSON.stringify(data));

    // Set encoding
    barChart.setAttribute("encoding", JSON.stringify({
        "x": {
            "field": "name"
        },
        "y": {
            "field": "population",
            "axis": {
                    "labelAngle": 45,
                },
                    // "scale": {
                    //     "type": "pow", //("type": "log")
                    //     "exponent": 0.5
                    // }
        },
        "color": {
            "field": "randomLang",
            "scale": {
                "domain": [
                    "Belarusian language",
                    "English language",
                    "Romani language",
                    "Persian language"
                ],
                "range": "Reds"
            },
            "title": "Language"
        },
        "direction": "vertical"
    }));
    
    barChart.setAttribute("legend", false );
}
