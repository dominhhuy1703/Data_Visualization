class WindowChart extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.render();
        this.mover = this.shadowRoot.querySelector('#window-header');
        this.cont = this.shadowRoot.querySelector('#window-container');
    }

    static get observedAttributes() {
        return ['data', 'chart-type'];
    }

    connectedCallback() {
        let graph = document.createElement(this.getAttribute("chart-type"));
        this.shadowRoot.querySelector('.content').appendChild(graph);
        graph.setAttribute('data', this.getAttribute('data'));
        // Add event: 'Close Window'
        this.shadowRoot.querySelector('.close-btn').addEventListener('click', () => {
            this.remove();
        });
        this.shadowRoot.querySelector('#title-text').textContent =this.getChartTitle(this.getAttribute("chart-type"));
        makeDraggable(this.cont)
    }

    attributeChangedCallback(name, oldValue, newValue) {
        console.log(`window received ${name}:`, newValue);
        // this.render();
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                window-chart {
                     display: block;
                    position: absolute;
                }
                .window {
                    width: 500px;
                    height: 500px;
                    background: white;
                    border-radius: 10px;
                    box-shadow: 0px 5px 15px rgba(0, 0, 0, 0.2);
                    overflow: hidden;
                    border: 1px solid #ccc;
                    position: absolute;
                    z-index: 9;
                }

                .title-bar {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 8px 12px;
                    background: #0078D7;
                    color: white;
                    font-weight: bold;
                    cursor: move;
                    z-index: 10;
                }

                .close-btn {
                    width: 16px;
                    height: 16px;
                    background: red;
                    border-radius: 50%;
                    cursor: pointer;
                }

                .content {
                    padding: 15px;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    height: 380px;
                }
            </style>

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