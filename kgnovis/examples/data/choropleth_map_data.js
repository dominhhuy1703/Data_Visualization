/**
 * fetchMapData.js
 * Mô tả: Truy vấn Wikidata rồi ghép với GeoJSON url
 */

// 1. Hàm fetch dữ liệu dân số + ISO từ Wikidata
async function fetchWikidata() {
  const query = `
    PREFIX bd: <http://www.bigdata.com/rdf#>
    PREFIX wd: <http://www.wikidata.org/entity/>
    PREFIX wdt: <http://www.wikidata.org/prop/direct/>

    SELECT ?country ?countryLabel ?population ?isoCode
    WHERE {
      ?country wdt:P31 wd:Q6256;
               wdt:P1082 ?population;
               wdt:P298 ?isoCode .
      SERVICE wikibase:label { bd:serviceParam wikibase:language "en" }
    }
    ORDER BY DESC(?population)
  `;
  const url = `https://query.wikidata.org/sparql?query=${encodeURIComponent(query)}&format=json`;

  const res = await fetch(url, {
    headers: { 'Accept': 'application/sparql-results+json' }
  });
  const data = await res.json();

  return data.results.bindings.map(b => ({
    country: b.countryLabel.value,
    isoCode: b.isoCode.value,
    population: parseInt(b.population.value, 10)
  }));
}

// 2. Hàm tải GeoJSON danh sách quốc gia (Natural Earth dataset)
async function fetchWorldGeoJSON() {
  const url =
    'https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson';
  const res = await fetch(url);
  return await res.json();
}

// 3. Hàm kết hợp dữ liệu Wikidata với GeoJSON
async function mergeMapData() {
  const wikidata = await fetchWikidata();
  const worldGeo = await fetchWorldGeoJSON();

  const geoByISO = new Map();
  for (const f of worldGeo.features) {
    const iso = f.id;
    if (iso) geoByISO.set(iso.toUpperCase(), f);
  }

  const merged = wikidata.map(wd => {
    const feature = geoByISO.get(wd.isoCode.toUpperCase()) || null;
    return {
      country: wd.country,
      isoCode: wd.isoCode,
      population: wd.population,
      geoJSON: feature
    };
  });


  return merged;
}
