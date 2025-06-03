// Funtion to make query for Node link
async function fetchNodeLinkData() {
    const query = `
        PREFIX dbo: <http://dbpedia.org/ontology/>
        PREFIX dbr: <http://dbpedia.org/resource/>
        PREFIX foaf: <http://xmlns.com/foaf/0.1/>
        PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

        SELECT ?band ?bandName ?member ?memberName WHERE {
            ?band dbo:genre dbr:Punk_rock ;
                foaf:name ?bandName ;
                dbo:bandMember ?member .

            ?member foaf:name ?memberName .

            FILTER(langMatches(lang(?bandName), "en") && langMatches(lang(?memberName), "en"))
        }
        LIMIT 10
    `;

    return await fetchSPARQLData(query);
}

// Function to parse node-link data from JSON
function parseNodeLinkJSON(jsonData) {
    let nodes = new Map();
    let links = [];

    for (let result of jsonData) {
        // console.log("Processing result:", result);
        // Access directly to required fields
        let band = result.band?.value;
        let bandName = result.bandName?.value;
        let member = result.member?.value;
        let memberName = result.memberName?.value;

        if (!nodes.has(bandName)) nodes.set(bandName, { id: nodes.size + 1, name: bandName });
        if (!nodes.has(memberName)) nodes.set(memberName, { id: nodes.size + 1, name: memberName });

        links.push({
            source: nodes.get(bandName).id,
            target: nodes.get(memberName).id
        });
    }

    return { nodes: Array.from(nodes.values()), links };
}