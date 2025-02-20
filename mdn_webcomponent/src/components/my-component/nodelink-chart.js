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
      <!-- <link rel="stylesheet" href="components/my-component/my-component.css"> -->
      <svg width="400" height="400"></svg>`;
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
      .attr("transform",
          `translate(0, 0)`);
      console.log("AAAAAAAAAAAA");

      // Initialize the links
      const link = svg
      .selectAll("line")
      .data(data.links)
      .join("line")
          .style("stroke", "#aaa")

      console.log("BBBBBBBBBBBBBB");

      // Initialize the nodes
      const node = svg
      .selectAll("circle")
      .data(data.nodes)
      .join("circle")
          .attr("r", 20)
          .style("fill", "#69b3a2");

      console.log("CCCCCCCCCCCC");

      // Let's list the force we wanna apply on the network
      const simulation = d3.forceSimulation(data.nodes)                 // Force algorithm is applied to data.nodes
          .force("link", d3.forceLink()                               // This force provides links between nodes
              .id(function(d) { return d.id; })                     // This provide  the id of a node
              .links(data.links)                                    // and this the list of links
          )
          .force("charge", d3.forceManyBody().strength(-1000))         // This adds repulsion between nodes. Play with the -400 for the repulsion strength
          .force("center", d3.forceCenter(width / 1.2, height / 2))     // This force attracts nodes to the center of the svg area
          .on("end", ticked);

      console.log("DDDDDDDDDDDDDDDDDDDDD");

      // This function is run at each iteration of the force algorithm, updating the nodes position.
      function ticked() {
      link
          .attr("x1", function(d) { return d.source.x; })
          .attr("y1", function(d) { return d.source.y; })
          .attr("x2", function(d) { return d.target.x; })
          .attr("y2", function(d) { return d.target.y; });

      node
          .attr("cx", function (d) { return d.x+6; })
          .attr("cy", function(d) { return d.y-6; });
      };
  }
}

customElements.define('nodelink-chart', NodeLinkChart);