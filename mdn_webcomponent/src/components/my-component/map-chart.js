class MapChart extends HTMLElement {
  #dataValue = '';
	#coreData = null;
	#width = 400;
	#height = 400;

  constructor() {
    super();
    this.data = null;
    this.attachShadow({ mode: "open" });
  }

  static get observedAttributes() {
    return ["data"];
  }

  connectedCallback() {
    this.render();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === "data" && newValue != null) {
		this.#dataValue = newValue;
		this.#coreData = JSON.parse(this.#dataValue); // Parse JSON data
		this.#width = this.#coreData.width, this.#height = this.#coreData.height;
		this.removeAttribute("data");
		this.drawChart();
	  }
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        .container {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100%;
        }
  
        svg {
          font: 10px sans-serif;
          display: block;
        }
  
        .tooltip {
          position: absolute;
          background: rgba(255, 255, 255, 0.9);
          border: 1px solid #ddd;
          padding: 8px;
          font-size: 12px;
          pointer-events: none;
          opacity: 0;
        }

        .land {
          fill: #ddd;
        }

        .states {
          fill: none;
          stroke: #fff;
        }

        .airport-arc {
          fill: none;
        }

        .airport:hover .airport-arc {
          stroke: #f00;
        }

        .airport-cell {
          fill: none;
          stroke: #000;
          stroke-opacity: 0.1;
          pointer-events: all;
        }

      </style>
      <script src="https://d3js.org/topojson.v1.min.js"></script>

      <div class="tooltip"></div>
      <div class="container">
        <svg width="960" height="600"></svg>
      </div>
    `;
  }

  drawChart() {
    let coreData = JSON.parse(this.#dataValue);
    const isConnected = coreData.connection;
    if (isConnected === "true"){
      this.drawConnectionMap();
    }
    else {this.drawGeoChart();}
  }

  // drawConnectionMap() {
  //   const svgElement = this.shadowRoot.querySelector("svg");
  //   const width = +svgElement.getAttribute("width");
  //   const height = +svgElement.getAttribute("height");
  //   const svg = d3.select(svgElement);
  //   const coreData = this.#coreData;
  
  //   const projection = d3.geoMercator()
  //     .scale(70)
  //     .center([0, 20])
  //     .translate([width / 2, height / 2]);
    
  //   const path = d3.geoPath().projection(projection);
  
  //   d3.select(svgElement).selectAll("*").remove(); // Remove
  
  //   const geoDataUrl = coreData.data.url;
  //   const nodes = coreData.transform[0].from.data.values;
  //   const connections = coreData.transform[0].to.data.values;
  
  //   const nodeById = new Map(nodes.map(d => [d.id, d]));
  
  //   // Load background of map
  //   d3.json(geoDataUrl).then(world => {
  //     // Draw background of map
  //     svg.append("g")
  //       .selectAll("path")
  //       .data(world.features)
  //       .enter().append("path")
  //       .attr("fill", "#eee")
  //       .attr("stroke", "#999")
  //       .attr("d", path);
  
  //     // Draw connection
  //     svg.append("g")
  //       .selectAll("path.connection")
  //       .data(connections)
  //       .enter().append("path")
  //       .attr("class", "connection")
  //       .attr("fill", "none")
  //       .attr("stroke", "#f00")
  //       .attr("stroke-width", 1)
  //       .attr("stroke-opacity", 0.6)
  //       .attr("d", d => {
  //         const source = nodeById.get(d.origin);
  //         const target = nodeById.get(d.destination);
  //         if (source && target) {
  //           const sourceCoords = projection([+source.longitude, +source.latitude]);
  //           const targetCoords = projection([+target.longitude, +target.latitude]);
  //           return `M${sourceCoords[0]},${sourceCoords[1]}L${targetCoords[0]},${targetCoords[1]}`;
  //         }
  //         return null;
  //       });
  
  //     // Draw node
  //     svg.append("g")
  //       .selectAll("circle.node")
  //       .data(nodes)
  //       .enter().append("circle")
  //       .attr("class", "node")
  //       .attr("cx", d => projection([+d.longitude, +d.latitude])[0])
  //       .attr("cy", d => projection([+d.longitude, +d.latitude])[1])
  //       .attr("r", 3)
  //       .attr("fill", "#333")
  //       .attr("stroke", "#fff")
  //       .attr("stroke-width", 0.5)
  //       .append("title")
  //       .text(d => d.id);
  //   });
  // }

  drawConnectionMap() {
    const svgElement = this.shadowRoot.querySelector("svg");
    const width = +svgElement.getAttribute("width");
    const height = +svgElement.getAttribute("height");
    const svg = d3.select(svgElement);
    const coreData = this.#coreData;
  
    const projection = d3.geoAlbers()
      .translate([width / 2, height / 2])
      .scale(1280);

    // Projection for World
    // const projection = d3.geoNaturalEarth1()
    //   .translate([width / 2, height / 2])
    //   .scale(width / 1.3 / Math.PI);


    const radius = d3.scaleSqrt()
      .domain([0, 100])
      .range([0, 14]);
      
    const path = d3.geoPath()
      .projection(projection)
      .pointRadius(2.5);

    // d3.select(svgElement).selectAll("*").remove(); // Clear old SVG
  
  
  
    Promise.all([
      d3.json("https://vega.github.io/vega-datasets/data/us-10m.json"),
      // d3.json("https://vega.github.io/vega-datasets/data/world-110m.json"),
      d3.csv("https://vega.github.io/vega-datasets/data/airports.csv", typeAirport),
      d3.csv("https://vega.github.io/vega-datasets/data/flights-airport.csv", typeFlight)
    ])
    .then(ready).catch(error => {
        console.error("Error loading data:", error);
      });
        
    function ready([us, airports, flights]) {

      if (!us.objects.land || !us.objects.states) {
        console.error("TopoJSON structure missing 'land' or 'states'. Found:", us.objects);
        return;
      }

      var airportByIata = new Map(airports.map(d => [d.iata, d]));
      console.log("AAAAA", airportByIata)
      // Attach the flights
      flights.forEach(flight => {
        var source = airportByIata.get(flight.origin),
            target = airportByIata.get(flight.destination);
          source.arcs.coordinates.push([[source.longitude, source.latitude], [target.longitude, target.latitude]]);
          target.arcs.coordinates.push([[target.longitude, target.latitude], [source.longitude, source.latitude]]);
          // source.arcs.coordinates.push([source, target]);
          // target.arcs.coordinates.push([target, source]);
      
      });
      
      // Filter the valid airports
      airports = airports
        .filter(function(d) { return d.arcs.coordinates.length; });

      // Draw background of map
      svg.append("path")
        .datum(topojson.feature(us, us.objects.land))
        .attr("class", "land")
        .attr("d", path);
  
      svg.append("path")
        .datum(topojson.mesh(us, us.objects.states, function(a, b) { return a !== b; }))
        .attr("class", "states")
        .attr("d", path);

      // Draw background of Map (World)
      // svg.append("path")
      //   .datum(topojson.feature(us, us.objects.countries))
      //   .attr("class", "land")
      //   .attr("d", path);


      // Draw the airport's node
      const airportCoordinates = airports.map(d => [d.longitude, d.latitude]);

      svg.append("path")
        .datum({type: "MultiPoint", coordinates: airportCoordinates})
        .attr("class", "airport-dots")
        .attr("d", path);

      var airport = svg.selectAll(".airport")
        .data(airports)
        .enter().append("g")
          .attr("class", "airport");


      airport.append("title")
        .text(function(d) { return d.name + " Airport" + "\n" + d.arcs.coordinates.length + " flights"; });

      airport.append("path")
        .attr("class", "airport-arc")
        .attr("d", function(d) { return path(d.arcs); });
      
      var delaunay = d3.Delaunay.from(
          airports,
          d => projection([d.longitude, d.latitude])[0],
          d => projection([d.longitude, d.latitude])[1]
        );      var voronoi = delaunay.voronoi([0, 0, width, height]);
        
      airport.append("path")
          .attr("class", "airport-cell")
          .attr("d", function(d, i) {
            const cell = voronoi.cellPolygon(i);
            return cell ? "M" + cell.join("L") + "Z" : null;

          });
    }
  
    function typeAirport(d) {
      d.longitude = +d.longitude;
      d.latitude = +d.latitude;
      d.arcs = {type: "MultiLineString", coordinates: []};
      return d;
    }
    
    function typeFlight(d) {
      d.count = +d.count;
      return d;
    }
  }
  
  drawGeoChart() {
    const svgElement = this.shadowRoot.querySelector("svg");
    let coreData = JSON.parse(this.#dataValue);
    console.log("AAAAAA",coreData)
    let data = coreData.transform[0].from.data.values;
    // let data = coreData.transform[0].values;
    const width = +svgElement.getAttribute("width");
    const height = +svgElement.getAttribute("height");
    const tooltip = this.shadowRoot.querySelector(".tooltip");
    
    const geoData = coreData.data.url;
    // const idVariable = coreData.encoding.id?.field;
    // const valueVariable = coreData.encoding.size?.field;
    const idVariable = "id";
    const valueVariable = "population";
    let projection;
    if (coreData.projection.type === "mercator") {
      projection = d3.geoMercator()
      .scale(70)
      .center([0, 20])
      .translate([width / 2, height / 2]);;
    }      
  
    const path = d3.geoPath().projection(projection);
  
    d3.select(svgElement).selectAll("*").remove();
    const svg = d3.select(svgElement);
  
    const userData = new Map(data.map(d => [d[idVariable], d[valueVariable]]));
    const minValue = d3.min(data, d => d[valueVariable]);
    const maxValue = d3.max(data, d => d[valueVariable]);
  
    const colorScale = d3.scaleThreshold()
      .domain([minValue, (minValue + maxValue) / 8, (minValue + maxValue) / 6, (minValue + maxValue) / 4, (minValue + maxValue) / 2, maxValue / 1.5])
      .range(d3.schemeBlues[6]);
    
    d3.json(geoData)
    // d3.json("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson")
      .then(geoData => {
        const zoom = d3.zoom()
          .scaleExtent([1, 8])
          .on("zoom", zoomed);
  
        svg.call(zoom);
  
        const g = svg.append("g");
  
        // Add legend
        const legendWidth = 300;
        const legendHeight = 20;
        const legendSvg = svg.append("g")
          .attr("transform", `translate(${width / 2 - legendWidth / 2}, ${height - 40})`);
  
        const defs = svg.append("defs");
        const linearGradient = defs.append("linearGradient")
          .attr("id", "legend-gradient")
          .attr("x1", "0%").attr("y1", "0%")
          .attr("x2", "100%").attr("y2", "0%");
  
        linearGradient.selectAll("stop")
          .data([
            { offset: "0%", color: colorScale(minValue) },
            { offset: "100%", color: colorScale(maxValue) }
          ])
          .enter().append("stop")
          .attr("offset", d => d.offset)
          .attr("stop-color", d => d.color);
  
        legendSvg.append("rect")
          .attr("x", 0)
          .attr("y", 0)
          .attr("width", legendWidth)
          .attr("height", legendHeight)
          .style("fill", "url(#legend-gradient)");
  
        const legendScale = d3.scaleLinear()
          .domain([minValue, maxValue])
          .range([0, legendWidth]);
  
        const legendAxis = d3.axisBottom(legendScale)
          .tickSize(legendHeight)
          .tickFormat(d => {
            if (d >= 1e9) return (d / 1e9) + "B";
            if (d >= 1e6) return (d / 1e6) + "M";
            if (d >= 1e3) return (d / 1e3) + "K";
            return d;
          })
          .ticks(5);
  
        legendSvg.append("g")
          .call(legendAxis)
          .select(".domain").remove();
  
        const legendPointer = legendSvg.append("polygon")
          .attr("points", "-6,-8 6,-8 0,0")
          .attr("fill", "black")
          .style("opacity", 0);
  
        const mouseOver = function (event, d) {
          const population = userData.get(d.id) || 0;
  
          d3.selectAll(".Country")
            .transition().duration(200)
            .style("opacity", 0.5);
          d3.select(this)
            .transition().duration(200)
            .style("opacity", 1)
            .style("stroke", "black");
  
          tooltip.innerHTML = `${d.properties.name}: ${population.toLocaleString()}`;
          tooltip.style.opacity = 1;
          tooltip.style.left = `${event.pageX + 10}px`;
          tooltip.style.top = `${event.pageY}px`;
  
          const legendX = legendScale(population);
          legendPointer
            .attr("transform", `translate(${legendX}, 0)`)
            .style("opacity", 1);
        };
  
        const mouseLeave = function () {
          d3.selectAll(".Country")
            .transition().duration(200)
            .style("opacity", 0.8);
          d3.select(this)
            .transition().duration(200)
            .style("stroke", "transparent");
  
          tooltip.style.opacity = 0;
          legendPointer.style("opacity", 0);
        };
  
        function clicked(event, d) {
          const [[x0, y0], [x1, y1]] = path.bounds(d);
          event.stopPropagation();
        
          // Reset all the colors
          g.selectAll(".Country")
            .transition().duration(200)
            .attr("fill", d => d.originalColor);
        
          // Fill red to the choosen nation
          d3.select(this)
            .transition().duration(200)
            .attr("fill", "red");
        
          // Zoom in the choosen nation
          svg.transition().duration(750).call(
            zoom.transform,
            d3.zoomIdentity
              .translate(width / 2, height / 2)
              .scale(Math.min(8, 0.9 / Math.max((x1 - x0) / width, (y1 - y0) / height)))
              .translate(-(x0 + x1) / 2, -(y0 + y1) / 2),
            d3.pointer(event, svg.node())
          );
        }
        
        function reset() {
          g.selectAll(".Country")
            .transition().duration(200)
            .attr("fill", d => d.originalColor);
        
          svg.transition().duration(750).call(
            zoom.transform,
            d3.zoomIdentity,
            d3.zoomTransform(svg.node()).invert([width / 2, height / 2])
          );
        }

        
        function zoomed(event) {
          const { transform } = event;
          g.attr("transform", transform);
          g.selectAll(".Country").attr("stroke-width", 1 / transform.k);
        }
  
        svg.on("click", () => {
          svg.transition().duration(750).call(
            zoom.transform,
            d3.zoomIdentity,
            d3.zoomTransform(svg.node()).invert([width / 2, height / 2])
          );
        });
  
        g.selectAll("path")
          .data(geoData.features)
          .enter()
          .append("path")
          .attr("d", path)
          .attr("fill", d => {
            const population = userData.get(d.id) || 0;
            const color = colorScale(population);
            d.originalColor = color; // Save the origin color
            return color;;
          })
          .style("stroke", "transparent")
          .attr("class", "Country")
          .style("opacity", 0.8)
          .on("mouseover", mouseOver)
          .on("mouseleave", mouseLeave)
          .on("click", clicked);
      });
  }
  
  
  
  
  
}

customElements.define("map-chart", MapChart);
