// class MyComponent extends HTMLElement {
//   constructor() {
//       super();
//       this.attachShadow({ mode: 'open' });
//       this.render();
//   }

//   static get observedAttributes() {
//       return ['data', 'nodelink-data'];
//   }

//   connectedCallback() {
//   }

//   attributeChangedCallback() {
//       this.render();
      
//   }

//   render() {
//       this.shadowRoot.innerHTML = `
//           <link rel="stylesheet" href="components/my-component/my-component.css">
//       `;

//       const runButton = this.shadowRoot.querySelector('#run');
//       runButton.addEventListener('click', () => this.updateChart());
//   }

//   updateChart() {

//   }
// }

// // customElements.define('my-component', MyComponent);