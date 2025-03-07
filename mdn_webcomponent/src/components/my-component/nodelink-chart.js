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
        <svg width="400" height="400"></svg>
      `;
    }
  
    drawChart() {
      const data = JSON.parse(this.getAttribute('data'));
      const svgElement = this.shadowRoot.querySelector('svg');
      const width = 400, height = 400;
  
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
        .force("link", d3.forceLink().id(d => d.id).links(data.links))
        .force("charge", d3.forceManyBody().strength(-1000))
        .force("center", d3.forceCenter(width / 2, height / 2))
        .on("tick", ticked);
  
      function ticked() {
        link
          .attr("x1", d => d.source.x)
          .attr("y1", d => d.source.y)
          .attr("x2", d => d.target.x)
          .attr("y2", d => d.target.y);
  
        node
          .attr("cx", d => d.x)
          .attr("cy", d => d.y);
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
    }
  }
  
  customElements.define('nodelink-chart', NodeLinkChart);
  