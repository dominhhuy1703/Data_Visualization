// Function make query for BarData
async function fetchStackedBarData() {
    const query = `
        PREFIX dbo: <http://dbpedia.org/ontology/>
        PREFIX dct: <http://purl.org/dc/terms/>

        SELECT ?year (COUNT(?film) AS ?count) ?genre
        WHERE {
        ?film a dbo:Film ;
                dbo:releaseDate ?releaseDate ;
                dbo:genre ?genreResource .
        ?genreResource rdfs:label ?genre .
        
        FILTER (LANG(?genre) = 'en')
        
        BIND (YEAR(?releaseDate) AS ?year)
        }
        GROUP BY ?year ?genre
        ORDER BY ?year ?genre
        
        LIMIT 20
    `;
    return await fetchSPARQLData(query);
}
