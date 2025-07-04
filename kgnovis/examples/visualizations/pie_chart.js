function drawPieChart(data) {
    const pieChart = document.querySelector('#pieChart');

    // Set configuration
    pieChart.setAttribute("description", "Pie chart - Countries with the largest population");
    pieChart.setAttribute("width", "400");
    pieChart.setAttribute("height", "400");

    pieChart.setAttribute("data", JSON.stringify(data));

    // Set encoding
    pieChart.setAttribute("encoding", JSON.stringify({
        "text": {
            "field": "name"
        },
        "theta": {
            "field": "population"
        },
        "color": {
            "field": "randomLang",
            "title": "Language",
            "scale": {
                "domain": [
                    "Belarusian language",
                    "English language",
                    "Romani language",
                    "Persian language"
                ],
                "range": "Sinebow"
            },
            // "title": "Language"
            // { radius: { "field": "population", "scale": { "type": "sqrt", "zero": true, "rangeMin": 20 } } }

        },
    }));

    pieChart.setAttribute("legend", true);
}
