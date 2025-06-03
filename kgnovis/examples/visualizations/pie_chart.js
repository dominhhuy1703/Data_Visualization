function drawPieChart(data) {
    document.querySelector('#pieChart').setAttribute('data', JSON.stringify({
        description: "Pie chart - Countries with the largest population",
        width: 400,
        height: 400,
        data: [{ values: data.map(d => ({ 
            country: d.name.value, 
            population: d.population.value, 
            language: d.randomLang.value 
        })) }],
        encoding: [
            { text: { "field": "country" } },
            { theta: { "field": "population" } },
            { color: { "field": "language" } },
            // { radius: { "field": "population", "scale": { "type": "sqrt", "zero": true, "rangeMin": 20 } } }
        ]
    }));
}