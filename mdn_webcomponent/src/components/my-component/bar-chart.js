// const scale_d3 = {'ordinal': d3.scaleOrdinal}

class BarChart extends HTMLElement {
	#dataValue = '';
  
	constructor() {
	  super();
	  this.data = null;
	  this.attachShadow({ mode: 'open' });
	}
  
	static get observedAttributes() {
	  return ['data'];
	}
  
	connectedCallback() {
	  this.render();
	}
  
	attributeChangedCallback(name, oldValue, newValue) {
	  if (name === "data" && newValue != null) {
		this.#dataValue = newValue;
		this.removeAttribute("data");
		this.drawChart();
	  }
	}
  
	render() {
	  this.shadowRoot.innerHTML = `
		<style>
			:host { display: block; width: 100%; height: 100%; position: relative; }
			.container { display: flex; justify-content: center; align-items: center; width: 100%; height: 100%; position: relative; flex-direction: column;}
			.bar-chart svg { display: block; margin: auto; }
			.popup { display: none; position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; padding: 20px; border-radius: 10px; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3); z-index: 1000; }
			.popup.show { display: block; }
			.info-popup { display: none; position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; padding: 20px; border-radius: 10px; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3); z-index: 1000; }
			.info-popup.show { display: block; }
			.overlay { display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.5); z-index: 999; }
			.overlay.show { display: block; }
			.color-picker-container { display: flex; flex-direction: column; }
			.color-item { display: flex; align-items: center; font-size: 14px; margin-bottom: 5px; }
			.color-item label { min-width: 100px; font-weight: bold; }
			.color-item input { width: 35px; height: 35px; border: none; cursor: pointer; }
			.change-color-btn { position: absolute; top: 10px; right: 10px; padding: 8px 12px; background: #007bff; color: white; border: none; cursor: pointer; border-radius: 5px; font-weight: bold; }
			.change-color-btn:hover { background: #0056b3; }
			.close-popup { margin-top: 10px; padding: 8px 12px; background: #dc3545; color: white; border: none; cursor: pointer; border-radius: 5px; font-weight: bold; }
			.close-popup:hover { background: #c82333; }
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
		  	.description {
				text-align: center;
				font-size: 22px;
				font-weight: bold;
				margin-bottom: 20px;
				display: block;
				width: 100%;
			}
		</style>
		<div class="container">
		  <svg></svg>
		  <div class="description"></div>
		  <div class="tooltip"></div>
		  <button class="change-color-btn">Change Color</button>
		  <div class="overlay"></div>
		  <div class="info-popup"></div>
		  <div class="popup">
			<div class="color-picker-container"></div>
			<button class="close-popup">Close</button>
		  </div>
		</div>
	  `;
	  this.shadowRoot.querySelector(".change-color-btn").addEventListener("click", () => this.togglePopup(true));
	  this.shadowRoot.querySelector(".close-popup").addEventListener("click", () => this.togglePopup(false));
	  this.shadowRoot.querySelector(".overlay").addEventListener("click", () => this.togglePopup(false));
	}
  
	togglePopup(show) {
	  const popup = this.shadowRoot.querySelector(".popup");
	  popup.classList.toggle("show", show);
	}
  
	drawChart() {
		const tooltip = this.shadowRoot.querySelector(".tooltip");
		let coreData = JSON.parse(this.#dataValue);
		const data = coreData.data[0].values;
		const width = coreData.width, height = coreData.height;
		const margin = { top: 20, right: 0, bottom: 40, left: 20 };
		const svgElement = this.shadowRoot.querySelector('svg');
		svgElement.innerHTML = '';
		
		let colorScale = coreData.scales.find((element) => element.name == "color");
		if (colorScale) {
			this.colorScale = scale_d3[colorScale.type]();
		}
		else {
			this.colorScale = d3.scaleOrdinal();
		}

		this.colorScale
			.domain(data.map(d => d.c).filter(c => c))
			// .domain(data.map(d => d.x)) // Sử dụng d.x cho nhãn
			.range(["#ff6347", "#4682b4", "#32cd32", "#ffcc00", "#8a2be2", "#9faecd"]);

		const x = d3.scaleBand().domain(data.map(d => d.x)).range([margin.left, width - margin.right]).padding(0.5);
		const y = d3.scaleLinear().domain([0, d3.max(data, d => d.y)]).nice().range([height - margin.bottom, margin.top]);
		const svg = d3.select(svgElement)
			.attr("width", width).attr("height", height).style("margin", "50px")
			.append("g")
			.attr("transform",
				"translate(" + margin.left + "," + margin.top + ")");;

				const xAxis = svg.append("g")
				.attr("transform", `translate(0,${height - margin.bottom})`)
				.call(d3.axisBottom(x));
			
			xAxis.selectAll("text")
				.text(d => d.length > 5 ? d.slice(0, 5) + "..." : d) // Rút gọn nếu > 5 ký tự
				.append("title") // Giữ nội dung đầy đủ khi hover
				.style("font-size", "14px")
				.text(d => d);
			// .selectAll("text")
			// .style("font-size", "14px");

		svg.append("g").attr("transform", `translate(${margin.left},0)`).call(d3.axisLeft(y));
		
		this.bars = svg.selectAll("rect")
			.data(data)
			.join("rect")
			.attr("x", d => x(d.x))  // Dùng d.x cho trục x
			.attr("y", d => y(d.y))  // Dùng d.y cho trục y
			.attr("height", d => y(0) - y(d.y))
			.attr("width", x.bandwidth())
			.attr("fill", d => d.c ? this.colorScale(d.c) : "steelblue")
			// .attr("fill", d => d.color || this.colorScale(d.x))
			.on("click", (event, d) => this.showInfoPopup(d))
			.on("mouseover", (event, d) => {
				tooltip.style.opacity = 1;
				tooltip.innerHTML = `<strong>${d.x}</strong>: ${d.y.toFixed(1)}`;
			
				d3.select(event.target)
					.attr("fill", "red") // Chuyển màu thành đỏ
					.style("stroke", "black")
					.style("opacity", 1);
			
				// Hiển thị giá trị trên thanh bar
				svg.append("text")
					.attr("class", "hover-value")
					.attr("x", x(d.x) + x.bandwidth() / 2)
					.attr("y", y(d.y) - 10)
					.attr("text-anchor", "middle")
					.attr("fill", "black")
					.style("font-size", "16px")
					.text(d.y);
			})
			.on("mousemove", (event) => {
				tooltip.style.left = (d3.pointer(event)[0] + width/2) + "px";
        		tooltip.style.top = (d3.pointer(event)[1] + height/2) + "px";
			})
			.on("mouseout", (event, d) => {
				tooltip.style.opacity = 0;
			
				d3.select(event.target)
					.attr("fill", d.c ? this.colorScale(d.c) : "steelblue") // Quay lại màu ban đầu
					.style("stroke", "none")
					.style("opacity", 1);
			
				// Xóa giá trị hiển thị khi hover ra ngoài
				svg.selectAll(".hover-value").remove();
			});
	
		// svg.selectAll(".bar-value")
		// 	.data(data)
		// 	.join("text")
		// 	.attr("class", "bar-value")
		// 	.attr("x", d => x(d.x) + x.bandwidth() / 2)
		// 	.attr("y", d => y(d.y) - 10)
		// 	.attr("text-anchor", "middle")
		// 	.attr("fill", "black")
		// 	.style("font-size", "16px")
		// 	.text(d => d.y);
		
		const chartDescription = this.shadowRoot.querySelector(".description");
		chartDescription.textContent = coreData.description;
		this.renderColorPickers(data);
	}
  
	showInfoPopup(d) {
	  const infoPopup = this.shadowRoot.querySelector(".info-popup");
	  infoPopup.innerHTML = `
		<div>Tag: ${d.x}</div>
		<div>Value: ${d.y}</div>
		<button class="close-popup">Close</button>
	  `;
	  infoPopup.classList.add("show");
	  this.shadowRoot.querySelector(".close-popup").addEventListener("click", () => infoPopup.classList.remove("show"));
	}
  
	renderColorPickers(data) {
	  const container = this.shadowRoot.querySelector(".color-picker-container");
	  container.innerHTML = data.map((d, index) => `
		<div class="color-item">
		  <label>${d.x}</label>
		  <input type="color" value="${d.color || this.colorScale(d.x)}" data-index="${index}">
		</div>
	  `).join("");
  
	  container.querySelectorAll("input[type='color']").forEach(input => {
		input.addEventListener("input", (event) => this.updateColor(event, data));
	  });
	}
  
	updateColor(event, data) {
	  const index = event.target.dataset.index;
	  const newColor = event.target.value;
	  data[index].color = newColor;
  
	  // Find column and update color
	  const bar = this.shadowRoot.querySelectorAll("rect")[index];
	  d3.select(bar)
		.transition()
		.duration(300)
		.attr("fill", newColor);
  
	  this.#dataValue = JSON.stringify(data); // Update data
	}
  
	get dataValue() {
	  return this.#dataValue;
	}
  
	set dataValue(data) {
	  this.#dataValue = data;
	}
  }
  
  customElements.define('bar-chart', BarChart);
  