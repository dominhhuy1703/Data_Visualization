// Function to make query for Map Chart
async function fetchMapData() {
    const query = `
        PREFIX bd: <http://www.bigdata.com/rdf#>
        PREFIX wd: <http://www.wikidata.org/entity/>
        PREFIX wdt: <http://www.wikidata.org/prop/direct/>
        PREFIX wikibase: <http://wikiba.se/ontology#>

        SELECT DISTINCT ?countryLabel ?population ?isoCode
        WHERE {
            ?country wdt:P31 wd:Q6256 ;   # Get the countryLabel
                    wdt:P1082 ?population ;  # Get population
                    wdt:P298 ?isoCode .  # Get ISO Code 3166-1 alpha-3
            SERVICE wikibase:label { bd:serviceParam wikibase:language "en" }
        }
        ORDER BY DESC(?population)
    `;

    return await fetchWikidataSPARQL(query);
}

// Function to get WikiData
async function fetchWikidataSPARQL(query) {
    const endpointUrl = "https://query.wikidata.org/sparql";
    const url = `${endpointUrl}?query=${encodeURIComponent(query)}&format=json`;

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: { 'Accept': 'application/sparql-results+json' }
        });

        const jsonData = await response.json();
        return jsonData.results ? jsonData.results.bindings : [];
    } catch (error) {
        console.error("Error fetching Wikidata SPARQL data:", error);
        return [];
    }
}