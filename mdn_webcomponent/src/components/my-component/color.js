class ColorChange extends HTMLElement {
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
    console.log("attributeChangedCallback called, name:", name, "newValue:", newValue);
    if (name === 'data' && newValue) {
      this.render();
    }
  }

  render() {
    const rawData = this.getAttribute('data');
    console.log("Raw data received in render:", rawData);
    const data = rawData ? JSON.parse(rawData) : [];
    

    this.shadowRoot.innerHTML = `
      <style>
        .color-picker-container {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }
        .color-item {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        label {
          min-width: 80px;
        }
      </style>
      <div class="color-picker-container">
        ${data
          .map(
            (d, index) => `
              <div class="color-item">
                <label>${d.tag}</label>
                <input type="color" value="${d.color || '#000000'}" data-index="${index}">
              </div>`
          )
          .join('')}
      </div>
    `;

    this.shadowRoot.querySelectorAll('input[type="color"]').forEach((input) => {
      input.addEventListener('input', (event) => this.updateColor(event));
    });
  }

  updateColor(event) {
    const index = event.target.dataset.index;
    const newColor = event.target.value;
    const data = JSON.parse(this.getAttribute('data'));

    console.log("Updated color data:", data);

    data[index].color = newColor;
    this.setAttribute('data', JSON.stringify(data));
    this.dispatchEvent(new CustomEvent('color-change', { detail: data, bubbles: true, composed: true }));
  }
}

customElements.define('color-change', ColorChange);
