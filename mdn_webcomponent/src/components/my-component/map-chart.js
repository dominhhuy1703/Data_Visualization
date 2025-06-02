class MapChart extends HTMLElement {
    #dataValue = '';
    #coreData = null;
    #data = null;
    #width = 400;
    #height = 400;
    #svg = null;

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

        let rawData = Array.isArray(this.#coreData.data)
            ? this.#coreData.data[0].values
            : this.#coreData.data.values;

        // Flatten SPARQL-style fields (i.e., { value: "..." })
        this.#data = rawData.map(d => {
            const flattened = {};
            for (const [key, valObj] of Object.entries(d)) {
                if (valObj && typeof valObj === "object" && "value" in valObj) {
                    const num = Number(valObj.value);
                    flattened[key] = isNaN(num) ? valObj.value : num;
                }
            }
            console.log("flat", flattened)
            return flattened;
        });

        this.#width = this.#coreData.width;
        this.#height = this.#coreData.height;

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
        let data = this.#data;
        const svgElement = this.shadowRoot.querySelector('svg');
        d3.select(svgElement).selectAll("g").remove();
        this.#svg = d3.select(svgElement)
            .attr("width", this.#width)
            .attr("height", this.#height);
    
        const isChoropleth = this.#coreData.mark === "geoshape" && !this.#coreData.layer;
        const isConnection = Array.isArray(this.#coreData.layer) && this.#coreData.layer.some(l => l.mark === "rule");
        const isBubbled = this.#coreData.bubble;
        const isHexbin = this.#coreData.hexbin;

        if (isChoropleth) {
            this.drawGeoChart();
        } else if (isConnection) {
            this.drawConnectionMap();
        } else if (isBubbled) {
            this.drawBubbleMap();
        } else if (isHexbin) {
            this.drawHexbinMap();
        } else {
            console.warn("Unable to determine chart type from metadata");
        }
    }
    
    
    drawHexbinMap() {
        const projection = d3.geoMercator()
            .scale(80)
            .translate([this.#width / 2, this.#height / 2]);
        
            
        const path = d3.geoPath().projection(projection);
    
        // attach with data's url
        Promise.all([
            d3.json("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson"),
            d3.csv("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/data_gpsLocSurfer.csv")
        ]).then(([geoData, pointData]) => {
        
            // Check data is TopoJSON or GeoJSON
            if (geoData.objects) {
                // Data is TOopoJSON
                geoData = topojson.feature(geoData, geoData.objects.land);  // Convert from TopoJSON to GeoJSON
            }
    
            // Transfer data from lon/lat to projected
            pointData.forEach(d => {
                d.projected = projection([+d.homelon, +d.homelat]);
            });
    
            const points = pointData.map(d => d.projected).filter(Boolean);
    
            // Create hexbin
            const hexbin = d3.hexbin()
                .radius(5);
                // .extent([[0, 0], [this.#width, this.#height]]);
    
            const bins = hexbin(points);
    
            // color scale
            const color = d3.scaleSequential(d3.interpolateYlOrRd)
                .domain([0, d3.max(bins, d => d.length)]);
    
            // // draw map
            // this.#svg.append("g")
            //     .selectAll("path")
            //     .data(geoData.features)  // data in geoJSON
            //     .enter()
            //     .append("path")
            //     .attr("fill", "#e0e0e0")
            //     .attr("d", path)
            //     .attr("stroke", "#999");

            // Draw map
            this.#svg.append("g")
            .selectAll("path")
            .data(geoData.features)
            .enter()
            .append("path")
                .attr("fill", "#b8b8b8")
                .attr("d", d3.geoPath()
                    .projection(projection)
                )
                .style("stroke", "none")
                .style("opacity", 3);
    
            // draw hexbinGroup
            const hexbinGroup = this.#svg.append("g")
                .attr("class", "hexbin-layer");
    
            hexbinGroup.selectAll(".hexagon")
                .data(bins, d => `${d.x},${d.y}`)
                .enter().append("path")
                .attr("class", "hexagon")
                .attr("d", hexbin.hexagon())
                .attr("transform", d => `translate(${d.x}, ${d.y})`)
                .style("fill", d => color(d.length))
                .style("stroke", "#333")
                .style("stroke-width", 0.2)
                .style("fill-opacity", 0.8);
    
            // Tooltip
            const tooltip = d3.select(this.shadowRoot.querySelector(".tooltip"));
    
            hexbinGroup.selectAll(".hexagon")
                .on("mouseover", (event, d) => {
                    tooltip.transition().duration(200).style("opacity", 1);
                    tooltip.html(`<strong>${d.length}</strong> surfers in this area`)
                        .style("left", (event.pageX + 10) + "px")
                        .style("top", (event.pageY - 28) + "px");
                })
                .on("mouseout", () => {
                    tooltip.transition().duration(500).style("opacity", 0);
                });
    
            // Legend
            const legendValues = [1, 50, 90];
    
            const legend = this.#svg.append("g")
                .attr("transform", `translate(${this.#width - 120}, ${this.#height/2 + 150})`);
    
            legendValues.forEach((val, i) => {
                const y = i * 20;
                legend.append("rect")
                    .attr("x", 0)
                    .attr("y", y)
                    .attr("width", 18)
                    .attr("height", 18)
                    .attr("fill", color(val));
    
                legend.append("text")
                    .attr("x", 25)
                    .attr("y", y + 13)
                    .text(`${val}+`)
                    .attr("font-size", "12px")
                    .attr("fill", "#333");
            });
    
        }).catch(err => {
            console.error("Error loading hexbin map data:", err);
        });
    }
    
    
    
    
    drawBubbleMap() {
        const height = this.#height;
        const width = this.#width;

        // Projection setup
        const projection = d3.geoMercator()
            // .center([0, 20])
            .scale(80)
            .translate([this.#width / 2, this.#height / 2]);
    
        const geoPath = d3.geoPath().projection(projection);
    
        Promise.all([
            d3.json("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson"),
            d3.csv("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/data_gpsLocSurfer.csv")
        ]).then(([geoData, bubbleData]) => {
    
        // Color scale
        const allContinents = [...new Set(bubbleData.map(d => d.homecontinent))];
        const color = d3.scaleOrdinal()
            .domain(allContinents)
            .range(d3.schemePaired);
    
        // Size scale
        const valueExtent = d3.extent(bubbleData, d => +d.n);
        const size = d3.scaleSqrt()
            .domain(valueExtent)
            .range([1, 50]);
    
        // Draw map
        this.#svg.append("g")
            .selectAll("path")
            .data(geoData.features)
            .enter()
            .append("path")
                .attr("fill", "#b8b8b8")
                .attr("d", d3.geoPath()
                    .projection(projection)
                )
                .style("stroke", "none")
                .style("opacity", 3);
    
        // === Tooltip ===
        const tooltip = d3.select(this.shadowRoot.querySelector(".tooltip"));
    
        // Draw bubbles
        this.#svg.selectAll("circle")
            .data(bubbleData.sort(function(a,b) { return +b.n - +a.n }).filter(function(d,i){ return i<1000 }))
            .enter()
            .append("circle")
                .attr("cx", function(d){ return projection([+d.homelon, +d.homelat])[0] })
                .attr("cy", function(d){ return projection([+d.homelon, +d.homelat])[1] })
                .attr("r", function(d){ return size(+d.n) })
                .style("fill", function(d){ return color(d.homecontinent) })
                .attr("stroke", function(d){ if(d.n>2000){return "black"}else{return "none"}  })
                .attr("stroke-width", 1)
                .attr("fill-opacity", .4)
                .on("mouseover", (event, d) => {
                    tooltip.transition().duration(200).style("opacity", 1);
                    tooltip.html(`
                        <strong>Continent:</strong> ${d.homecontinent}<br/>
                        <!-- ><strong>Country:</strong> ${d.homecountry}<br/> -->
                        <strong>Surfers:</strong> ${d.n}
                    `)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 28) + "px");
                })
                .on("mouseout", () => {
                    tooltip.transition().duration(500).style("opacity", 0);
                });
    
        // Title
        this.#svg.append("text")
            .attr("text-anchor", "end")
            .style("fill", "black")
            .attr("x", this.#width - 10)
            .attr("y", this.#height - 30)
            .attr("width", 90)
            .text("WHERE SURFERS LIVE")
            .style("font-size", 14);
    
        // Add legend: circles
        var valuesToShow = [100,4000,15000]
        var xCircle = 40
        var xLabel = 90
        this.#svg
            .selectAll("legend")
            .data(valuesToShow)
            .enter()
            .append("circle")
            .attr("cx", xCircle)
            .attr("cy", function(d){ return height - size(d)} )
            .attr("r", function(d){ return size(d) })
            .style("fill", "none")
            .attr("stroke", "black")

        // Add legend: segments
        this.#svg
            .selectAll("legend")
            .data(valuesToShow)
            .enter()
            .append("line")
            .attr('x1', function(d){ return xCircle + size(d) } )
            .attr('x2', xLabel)
            .attr('y1', function(d){ return height - size(d) } )
            .attr('y2', function(d){ return height - size(d) } )
            .attr('stroke', 'black')
            .style('stroke-dasharray', ('2,2'))

        // Add legend: labels
        this.#svg
            .selectAll("legend")
            .data(valuesToShow)
            .enter()
            .append("text")
            .attr('x', xLabel)
            .attr('y', function(d){ return height - size(d) } )
            .text( function(d){ return d } )
            .style("font-size", 10)
            .attr('alignment-baseline', 'middle')
            
        // === Color legend (continent) ===
        const legendContainer = this.#svg.append("g")
            .attr("transform", `translate(${this.#width - 150}, 20)`);
    
        allContinents.forEach((continent, i) => {
            const legendRow = legendContainer.append("g")
            .attr("transform", `translate(0, ${i * 20})`);
    
            legendRow.append("rect")
            .attr("width", 12)
            .attr("height", 12)
            .attr("fill", color(continent));
    
            legendRow.append("text")
            .attr("x", 18)
            .attr("y", 10)
            .text(continent)
            .style("font-size", "12px")
            .attr("fill", "#333");
        });
    
        }).catch(error => {
        console.error("Error loading data:", error);
        });
    }      

    // drawConnectionMap() {
    drawConnectionMap() {
        const tooltip = this.shadowRoot.querySelector(".tooltip");
        const layers = this.#coreData.layer;
        const connectionLayer = layers.find(l => l.mark === "rule");
        const airportLayer = layers.find(l => l.mark === "circle");
        const mapLayer = layers.find(l => l.mark?.type === "geoshape");
    
        const mapUrl = mapLayer?.data?.url;
        console.log("MAP", mapUrl)
        const airportsUrl = airportLayer?.data?.url;
        const flightsUrl = connectionLayer?.data?.url;
        const originFilter = connectionLayer?.transform?.find(t => t.filter)?.filter?.equal;
        const projectionType = connectionLayer?.projection?.type || "albersUsa";

        // const projection = d3.geoAlbersUsa()
        //     .scale(1280)
        //     .translate([this.#width / 2, this.#height / 2]);
        console.log("Projection Type from grammar:", projectionType);

        const projection = d3[`geo${projectionType.charAt(0).toUpperCase() + projectionType.slice(1)}`]()
    .fitSize([this.#width, this.#height], { type: "Sphere" });

            console.log("D3 Projection Object:", projection);


        const path = d3.geoPath().projection(projection);
        
        const map = this.#svg.append("g").attr("class", "map");
        const routes = this.#svg.append("g").attr("class", "routes");
        const points = this.#svg.append("g").attr("class", "airports");
        console.log("mapUrl:", mapUrl);
        console.log("airportsUrl:", airportsUrl);
        console.log("flightsUrl:", flightsUrl);
        console.log("originFilter:", originFilter);

        d3.json(mapUrl).then(geoData => {
            const states = topojson.feature(geoData, geoData.objects.states).features;
            map.selectAll("path")
                .data(states)
                .enter()
                .append("path")
                .attr("d", path)
                .attr("fill", "#ddd")
                .attr("stroke", "#fff")
                .attr("stroke-width", 1);

            d3.csv(airportsUrl).then(airportsData => {
                d3.csv(flightsUrl).then(flightsData => {
                    const airportMap = new Map(airportsData.map(d => [d.iata, d]));
                    
                    // Filter theo originFilter
                    const filteredFlights = flightsData.filter(f => f.origin === originFilter);
                    console.log

                    // Calculate the number of route flights from each airport
                    const routeCounts = {};
                    flightsData.forEach(flight => {
                        routeCounts[flight.origin] = (routeCounts[flight.origin] || 0) + 1;
                    });
    
                    const sizeScale = d3.scaleSqrt()
                    .domain([0, d3.max(Object.values(routeCounts))])
                    .range([0, 10]);
                    
                    const usedIATAs = new Set();
                    flightsData.forEach(flight => {
                        usedIATAs.add(flight.origin);
                        usedIATAs.add(flight.destination);
                    });
                    
                        // Put a filter for valid airports
                    const filteredAirports = airportsData.filter(d => usedIATAs.has(d.iata));
    
                    // Sort by the number of route flights
                    filteredAirports.sort((a, b) => (routeCounts[b.iata] || 0) - (routeCounts[a.iata] || 0));
    
                    points.selectAll("circle")
                        .data(filteredAirports)
                        .enter()
                        .append("circle")
                        .attr("cx", d => {
                            const coords = projection([+d.longitude, +d.latitude]);
                            return coords ? coords[0] : null;
                        })
                        .attr("cy", d => {
                            const coords = projection([+d.longitude, +d.latitude]);
                            return coords ? coords[1] : null;
                        })
                        .attr("r", d => sizeScale(routeCounts[d.iata] || 0))
                        .attr("fill", "steelblue") // Color for airports
                        .attr("fill-opacity", 0.5)
                        .attr("stroke", "none")
                        .on("mouseover", (event, d) => {
                            tooltip.innerHTML = `Airport: ${d.name} (${d.iata})<br>Routes: ${routeCounts[d.iata] || 0}`;
                            tooltip.style.opacity = 1;
                            tooltip.style.left = `${event.pageX + 10}px`;
                            tooltip.style.top = `${event.pageY}px`;

                            routes.selectAll("line").remove();

                            // Filter for valid flights
                            const relatedFlights = flightsData.filter(f =>
                                f.origin === d.iata || f.destination === d.iata
                            );
                            
                            relatedFlights.forEach(flight => {
                                const origin = airportMap.get(flight.origin);
                                const destination = airportMap.get(flight.destination);

                                if (origin && destination) {
                                    const originCoords = projection([+origin.longitude, +origin.latitude]);
                                    const destCoords = projection([+destination.longitude, +destination.latitude]);

                                    if (originCoords && destCoords) {
                                        routes.append("line")
                                            .attr("x1", originCoords[0])
                                            .attr("y1", originCoords[1])
                                            .attr("x2", destCoords[0])
                                            .attr("y2", destCoords[1])
                                            .attr("stroke", "#666")
                                            .attr("stroke-opacity", 0.5)
                                            .attr("stroke-width", 1);
                                    }
                                }
                            });
                        })
                        .on("mouseleave", () => {
                            tooltip.style.opacity = 0;
                            routes.selectAll("line").remove();
                        });

                });
            });
        });
    }
    
    
    
  
    drawGeoChart() {
        const tooltip = this.shadowRoot.querySelector(".tooltip");
        
        const geoData = this.#coreData.data.url;
        const idVariable = this.#coreData.encoding.id?.field;
        const labelVariable = this.#coreData.encoding.label?.field;
        const labelData = new Map(this.#data.map(d => [d[idVariable], d[labelVariable]]));
              console.log("Label", labelData)

        const valueVariable = this.#coreData.encoding.value?.field;

        let projection;
        if (this.#coreData.projection.type === "mercator") {
            projection = d3.geoMercator()
            .scale(70)
            .center([0, 20])
            .translate([this.#width / 2, this.#height / 2]);;
        }      
    
        const path = d3.geoPath().projection(projection);
        
        const userData = new Map(this.#data.map(d => [d[idVariable], d[valueVariable]]));
        const minValue = d3.min(this.#data, d => d[valueVariable]);
        const maxValue = d3.max(this.#data, d => d[valueVariable]);
    
        const colorScale = d3.scaleThreshold()
            .domain([minValue, (minValue + maxValue) / 8, (minValue + maxValue) / 6, (minValue + maxValue) / 4, (minValue + maxValue) / 2, maxValue / 1.5])
            .range(d3.schemeBlues[6]);
        
        d3.json(geoData)
        // d3.json("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson")
            .then(geoData => {
                const zoom = d3.zoom()
                .scaleExtent([1, 8])
                .on("zoom", zoomed);
    
            this.#svg.call(zoom);
    
            const g = this.#svg.append("g");
    
            // Add legend
            const legendWidth = 300;
            const legendHeight = 20;
            const legendsvg = this.#svg.append("g")
            .attr("transform", `translate(${this.#width / 2 - legendWidth / 2}, ${this.#height - 40})`);
    
            const defs = this.#svg.append("defs");
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
    
            legendsvg.append("rect")
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
    
            legendsvg.append("g")
            .call(legendAxis)
            .select(".domain").remove();
    
            const legendPointer = legendsvg.append("polygon")
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
    
            const label = labelData.get(d.id) || d.id;
            console.log("Label", label)

            tooltip.innerHTML = `${label}: ${population.toLocaleString()}`;
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
            this.#svg.transition().duration(750).call(
                zoom.transform,
                d3.zoomIdentity
                .translate(this.#width / 2, this.#height / 2)
                .scale(Math.min(8, 0.9 / Math.max((x1 - x0) / this.#width, (y1 - y0) / this.#height)))
                .translate(-(x0 + x1) / 2, -(y0 + y1) / 2),
                d3.pointer(event, this.#svg.node())
            );
            }
            
            function reset() {
                g.selectAll(".Country")
                    .transition().duration(200)
                    .attr("fill", d => d.originalColor);
            
                this.#svg.transition().duration(750).call(
                    zoom.transform,
                    d3.zoomIdentity,
                    d3.zoomTransform(this.#svg.node()).invert([this.#width / 2, this.#height / 2])
                );
            }
            
            function zoomed(event) {
                const { transform } = event;
                g.attr("transform", transform);
                g.selectAll(".Country").attr("stroke-width", 1 / transform.k);
            }
    
            this.#svg.on("click", () => {
                this.#svg.transition().duration(750).call(
                    zoom.transform,
                    d3.zoomIdentity,
                    d3.zoomTransform(this.#svg.node()).invert([this.#width / 2, this.#height / 2])
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
