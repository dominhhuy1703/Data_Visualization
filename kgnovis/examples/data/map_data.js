async function fetchMapData() {
	const query = `
        PREFIX bd: <http://www.bigdata.com/rdf#>
        PREFIX wd: <http://www.wikidata.org/entity/>
        PREFIX wdt: <http://www.wikidata.org/prop/direct/>

        SELECT ?countryLabel ?population ?isoCode ?geoShape
        WHERE {
            ?country wdt:P31 wd:Q6256;
                    wdt:P1082 ?population;
                    wdt:P298 ?isoCode;
                    wdt:P3896 ?geoShape .
            SERVICE wikibase:label { bd:serviceParam wikibase:language "en" }
        }
        ORDER BY DESC(?population)
    `;

	const endpointUrl = "https://query.wikidata.org/sparql";
	const url = `${endpointUrl}?query=${encodeURIComponent(query)}&format=json`;

	try {
		const response = await fetch(url, {
			headers: { 'Accept': 'application/sparql-results+json' }
		});

		const jsonData = await response.json();
		console.log("map raw data", jsonData);
		// ✅ Trả về toàn bộ object
		return jsonData;

	} catch (err) {
		console.error("SPARQL fetch error:", err);
		return null;
	}
}
