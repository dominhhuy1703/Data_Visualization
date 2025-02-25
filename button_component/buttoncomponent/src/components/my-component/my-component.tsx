import { Element, Component, Host, Prop, h, State } from '@stencil/core';
import { select } from 'd3-selection';
import { pie, arc } from 'd3-shape';
import { scaleOrdinal } from 'd3-scale';
import { quantize } from 'd3-interpolate';
import { interpolateCool } from 'd3-scale-chromatic';

@Component({
  tag: 'my-component',
  styleUrl: 'my-component.css',
  shadow: true,
})
export class MyComponent {
  @Element() element: HTMLElement;
  @Prop() width: number = 400;
  @Prop() height: number = 400;
  @Prop() data: string = "[]";

  @State() selectedTag: string = "";
  @State() isPopupVisible: boolean = false;

  public chartData: any;

  constructor() {
    this.chartData = JSON.parse(this.data);
  }

  componentDidLoad() {
    let svg = select(this.element.shadowRoot.querySelectorAll(".chart")[0])
      .attr("width", this.width)
      .attr("height", this.height);
    this.buildChart(svg);
  }

  buildChart(svg) {
    let radius = Math.min(this.width, this.height) / 2;
    let arcShape = arc().innerRadius(radius * 0.4).outerRadius(radius - 1);
    let arcShapeLabels = arc().outerRadius(radius - 1).innerRadius(radius * 0.7);

    let colorScale = scaleOrdinal()
      .domain(this.chartData.map(d => d.tag))
      .range(quantize(t => interpolateCool(t * 0.8 + 0.1), this.chartData.length).reverse());

    let pieDataStructure = pie().sort(null).value(d => d.value)(this.chartData);

    let self = this;

    svg.append("g")
      .attr("transform", `translate(${this.width / 2}, ${this.height / 2})`)
      .attr("stroke", "white")
      .selectAll("path")
      .data(pieDataStructure)
      .join("path")
      .attr("fill", d => colorScale(d.data.tag))
      .attr("d", arcShape)
      .on('click', function (event, d) {
        console.log("Click event: ", event);
        self.selectedTag = d.data.tag;
        self.isPopupVisible = true;
      });

    svg.append("g")
      .attr("transform", `translate(${this.width / 2}, ${this.height / 2})`)
      .attr("font-family", "sans-serif")
      .attr("font-size", 14)
      .attr("font-weight", 800)
      .attr("text-anchor", "middle")
      .selectAll("text")
      .data(pieDataStructure)
      .join("text")
      .attr("transform", d =>
        `translate(${arcShapeLabels.centroid(d)[0] * 0.8},${arcShapeLabels.centroid(d)[1] * 0.8})`
      )
      .call(
        text => text.append("tspan")
          .attr("x", "0")
          .attr("dy", "0em")
          .text(d => d.data.tag)
      )
      .call(
        text => text.append("tspan")
          .attr("x", "0")
          .attr("dy", "1.2em")
          .text(d => d.data.value)
      );
  }

  closePopup() {
    this.isPopupVisible = false;
  }

  render() {
    return (
      <Host>
        <div class="container">
          <svg class="chart" />
        </div>

        {this.isPopupVisible && (
          <div class="popup-overlay">
            <div class="popup-content">
              <h3>Your choice:</h3>
              <p>{this.selectedTag}</p>
              <button onClick={() => this.closePopup()}>Close</button>
            </div>
          </div>
        )}
      </Host>
    );
  }
}
