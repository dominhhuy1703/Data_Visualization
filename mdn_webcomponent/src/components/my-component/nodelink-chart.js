class NodeLinkChart extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
    }
  
    static get observedAttributes() {
      return ['data'];
    }
  
    connectedCallback() {
      this.render();
    }
  
    attributeChangedCallback(name, oldValue, newValue) {
      this.drawChart();
    }
  
    render() {
      this.shadowRoot.innerHTML = `
        <style>
                .tooltip {
                  position: absolute;
                  opacity: 0;
                  background: white;
                  border: solid 1px black;
                  border-radius: 5px;
                  padding: 5px;
                  font-size: 14px;
                  pointer-events: auto;
                  transition: opacity 0.2s;
                  z-index: 9999;
                }
        </style>
        <svg></svg>
        <div class="tooltip" id="tooltip"></div>
        
      `;
    }
  
    drawChart() {
      const data = JSON.parse(this.getAttribute('data'));
      const svgElement = this.shadowRoot.querySelector('svg');
      const tooltip = this.shadowRoot.querySelector('#tooltip');
      const width = 800, height = 800;
  
      d3.select(svgElement).selectAll("g").remove();
  
      const svg = d3.select(svgElement)
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", `translate(0, 0)`);
  
      // Initialize the links
      const link = svg
        .selectAll("line")
        .data(data.links)
        .join("line")
        .style("stroke", "#aaa");
  
      // Initialize the nodes
      const node = svg
        .selectAll("circle")
        .data(data.nodes)
        .join("circle")
        .attr("r", 20)
        .style("fill", "#69b3a2");
  
      // Force simulation
      const simulation = d3.forceSimulation(data.nodes)
        .force("link", d3.forceLink().id(d => d.id).links(data.links).distance(80)) // Khoảng cách giữa các node
        .force("charge", d3.forceManyBody().strength(-200)) // Lực đẩy giảm xuống
        .force("center", d3.forceCenter(width / 2, height / 2)) // Giữ node ở giữa
        .force("collide", d3.forceCollide().radius(20)) // Tránh node bị đẩy quá xa
        .on("tick", ticked);

  
      function ticked() {
          link
            .attr("x1", function(d) {
              // Giới hạn vị trí x của điểm bắt đầu của link để không ra ngoài cửa sổ
              return Math.max(20, Math.min(width - 20, d.source.x)); // Giới hạn x của điểm bắt đầu
            })
            .attr("y1", function(d) {
              // Giới hạn vị trí y của điểm bắt đầu của link để không ra ngoài cửa sổ
              return Math.max(20, Math.min(height - 20, d.source.y)); // Giới hạn y của điểm bắt đầu
            })
            .attr("x2", function(d) {
              // Giới hạn vị trí x của điểm kết thúc của link để không ra ngoài cửa sổ
              return Math.max(20, Math.min(width - 20, d.target.x)); // Giới hạn x của điểm kết thúc
            })
            .attr("y2", function(d) {
              // Giới hạn vị trí y của điểm kết thúc của link để không ra ngoài cửa sổ
              return Math.max(20, Math.min(height - 20, d.target.y)); // Giới hạn y của điểm kết thúc
            });
        
          node
            .attr("cx", function(d) {
              // Giới hạn vị trí x của node để không ra ngoài
              return Math.max(20, Math.min(width - 20, d.x)); // Giới hạn x giữa 20 và width - 20
            })
            .attr("cy", function(d) {
              // Giới hạn vị trí y của node để không ra ngoài
              return Math.max(20, Math.min(height - 20, d.y)); // Giới hạn y giữa 20 và height - 20
            });
      }
  
      // Adding drag functionality to nodes
      node.call(d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended));
  
      function dragstarted(event) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
      }
  
      function dragged(event) {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
      }
  
      function dragended(event) {
        if (!event.active) simulation.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;
      }
      
      // Show tooltip on hover
      // Show tooltip on hover
      node.on("mouseover", (event, d) => {
        // Set the tooltip text and visibility using textContent
        tooltip.style.opacity = 1;
        tooltip.innerHTML = `<strong>${d.name}</strong>`;
        d3.select(event.target).style("stroke", "black").style("opacity", 1); // Use direct manipulation for visibility
      })
      .on("mousemove", (event) => {
        tooltip.style.left = (d3.pointer(event)[0] + width/4) + "px";
        tooltip.style.top = (d3.pointer(event)[1] + height/4) + "px";
      })
      .on("mouseout", (event) => {
          // Hide the tooltip when mouseout
        tooltip.style.opacity = 0;
        d3.select(event.target).style("stroke", "white").style("opacity", 1);
      });
    }
  }
  
  customElements.define('nodelink-chart', NodeLinkChart);
  