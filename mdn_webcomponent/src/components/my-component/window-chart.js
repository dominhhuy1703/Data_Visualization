class WindowChart extends HTMLElement {

    #dataValue = "";

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.render();
        this.mover = this.shadowRoot.querySelector('#window-header');
        this.cont = this.shadowRoot.querySelector('#window-container');
        this.graph = null;
    }

    static get observedAttributes() {
        return ['data', 'chart-type'];
    }

    connectedCallback() {
        this.graph = document.createElement(this.getAttribute("chart-type"));
        this.shadowRoot.querySelector('.content').appendChild(this.graph);
        this.graph.setAttribute('data', this.dataValue);
        // Add event: 'Close Window'
        this.shadowRoot.querySelector('.close-btn').addEventListener('click', () => {
            this.remove();
        });
        this.shadowRoot.querySelector('#title-text').textContent =this.getChartTitle(this.getAttribute("chart-type"));
        makeDraggable(this.cont)
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === "data" && newValue != null){
            this.#dataValue = newValue; 
            this.removeAttribute("data");
        }
        // this.render();
    }

    render() {
        this.shadowRoot.innerHTML = `
            <link rel="stylesheet" href="components/my-component/customStyle.css">
            
            <div class="window" id='window-container'>
                <div class="title-bar" id='window-header'>
                    <span id="title-text"></span>
                    <div class="close-btn"></div>
                </div>
                <div class="content"></div>
            </div>
        `;
    }

    getChartTitle(type) {
        switch (type) {
            case 'pie-chart': return 'Pie Chart';
            case 'bar-chart': return 'Bar Chart';
            case 'nodelink-chart': return 'NodeLink Diagram';
            case 'map-chart': return 'Map'
            default: return 'Chart';
        }
    };

    get dataValue() {
        return this.#dataValue;
    }

    set dataValue(data){
        this.#dataValue = data;
    }
}
function makeDraggable (element) {
    // Make an element draggable (or if it has a .window-top class, drag based on the .window-top element)
    let currentPosX = 0, currentPosY = 0, previousPosX = 0, previousPosY = 0;

		// If there is a window-top classed element, attach to that element instead of full window
    if (element.querySelector('.window-header')) {
        // If present, the window-top element is where you move the parent element from
        element.querySelector('.window-top').onmousedown = dragMouseDown;
    }
    else {
        // Otherwise, move the element itself
        element.onmousedown = dragMouseDown;
    }

    function dragMouseDown (e) {
        // Prevent any default action on this element (you can remove if you need this element to perform its default action)
        e.preventDefault();
        // Get the mouse cursor position and set the initial previous positions to begin
        previousPosX = e.clientX;
        previousPosY = e.clientY;
        // When the mouse is let go, call the closing event
        document.onmouseup = closeDragElement;
        // call a function whenever the cursor moves
        document.onmousemove = elementDrag;
    }

    function elementDrag (e) {
        // Prevent any default action on this element (you can remove if you need this element to perform its default action)
        e.preventDefault();
        // Calculate the new cursor position by using the previous x and y positions of the mouse
        currentPosX = previousPosX - e.clientX;
        currentPosY = previousPosY - e.clientY;
        // Replace the previous positions with the new x and y positions of the mouse
        previousPosX = e.clientX;
        previousPosY = e.clientY;
        // Set the element's new position
        element.style.top = (element.offsetTop - currentPosY) + 'px';
        element.style.left = (element.offsetLeft - currentPosX) + 'px';
    }

    function closeDragElement () {
        // Stop moving when mouse button is released and release events
        document.onmouseup = null;
        document.onmousemove = null;
    }
}
customElements.define('window-chart', WindowChart);