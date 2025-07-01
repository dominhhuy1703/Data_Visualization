// Function make query for BarData
async function fetchBarData() {
    const query = `
        PREFIX dbpprop: <http://dbpedia.org/property/>
        PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
        PREFIX yago: <http://dbpedia.org/class/yago/>
        PREFIX dbo: <http://dbpedia.org/ontology/>
        PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>

        SELECT DISTINCT ?name ?population (SAMPLE(?lang) AS ?randomLang)
        WHERE {
        ?country a dbo:Country ;
                rdfs:label ?enName ;
                dbo:language [ rdfs:label ?lang ] .
        
        OPTIONAL { ?country dbpprop:populationEstimate ?popEstimate. }
        OPTIONAL { ?country dbpprop:populationCensus ?popCensus. }
        BIND(coalesce(?popEstimate, ?popCensus) AS ?populationRaw)
        
        FILTER (
            EXISTS { ?country (dbpprop:iso3166code|dbpprop:iso31661Alpha|dbpprop:countryCode) ?code }
            || EXISTS { ?country a yago:MemberStatesOfTheUnitedNations }
        )
        
        FILTER(langMatches(lang(?enName), "en"))
        
        BIND(
            IF(datatype(?populationRaw) = xsd:integer,
            ?populationRaw,
            xsd:integer(?populationRaw)
            ) AS ?population
        )
        FILTER(BOUND(?population))
        
        BIND(str(?enName) AS ?name)
        }
        GROUP BY ?name ?population
        LIMIT 10
    `;
    console.log("AAAAAAAAA")
    return await fetchSPARQLData(query);
}

async function fetchSPARQLData(query) {
    const endpointUrl = "https://dbpedia.org/sparql";
    const url = `${endpointUrl}?query=${encodeURIComponent(query)}`;

    // console.log("Fetching data from SPARQL endpoint...");  // Đoạn log này kiểm tra trước khi gọi fetch()

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: { 'Accept': 'application/sparql-results+json' }
        });

        const jsonData = await response.json();

        console.log("Fetched SPARQL Data:", jsonData);  // In ra dữ liệu raw (bao gồm cả head và results)
        return jsonData;  // Trả về toàn bộ dữ liệu bao gồm cả head và results
    } catch (error) {
        console.error("Error fetching SPARQL data:", error);
        return [];
    }
}


