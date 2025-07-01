async function fetchPieData() {
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
    return await fetchSPARQLData(query);
}
