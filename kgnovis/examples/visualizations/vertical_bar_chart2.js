function drawVerticalChart2(data){
    const barChart = document.querySelector('#verticalChart2');

    // Set configuration
    barChart.setAttribute("description", "Horizontal Vertical - Population of countries");
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
            "field": "population"
        },
        "color": {
            "field": "randomLang",
            "scale": {
                "domain": ["Belarusian language", "aaa", "Russian language", "French language", "لغة تشيلوبا", "English language", "Mongolian language", "Romani language", "Angolar language", "Persian language"],
                "range": "Reds"
            },
            "title": "Language"
        },
        "direction": "horizontal"
    }));
    barChart.setAttribute("legend", true);
}