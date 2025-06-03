// Function to find the highest z-index among all window-chart elements
function findHighestZIndex()
{
    const allWindows = document.querySelectorAll('window-chart');
    let highestZIndex = 1; // Initialize with a low z-index
    allWindows.forEach(window => {
        // Get the z-index of the .window element inside each window-chart
        const zIndex = parseInt(window.shadowRoot.querySelector('.window').style.zIndex, 10);
        if (zIndex > highestZIndex) {
            highestZIndex = zIndex; // Update if a higher z-index is found
        }
    });
    return highestZIndex; // Return the highest z-index found
};

// Define the custom WindowChart element class
class WindowChart extends HTMLElement {

    #dataValue = ""; // Private property to hold the chart data

    constructor() {
        super();
        this.attachShadow({ mode: 'open' }); // Attach shadow DOM to the custom element
        this.render();
        this.mover = this.shadowRoot.querySelector('#window-header'); // Get the header element for dragging
        this.cont = this.shadowRoot.querySelector('#window-container'); // Get the container element for window position
        this.graph = null; // Initialize graph variable to hold the chart
    }

    // Observe changes to 'data' and 'chart-type' attributes
    static get observedAttributes() {
        return ['data', 'chart-type'];
    }

    // Called when the element is added to the DOM
    connectedCallback() {
        // Create the appropriate chart type element (e.g., pie, bar)
        this.graph = document.createElement(this.getAttribute("chart-type"));
        this.shadowRoot.querySelector('.content').appendChild(this.graph); // Append the chart to the content

        this.graph.setAttribute('data', this.dataValue); // Set the data attribute on the chart

        // Add event: 'Close Window'
        this.shadowRoot.querySelector('.close-btn').addEventListener('click', () => {
            this.remove();
        });

        // Set the window title based on chart type
        this.shadowRoot.querySelector('#title-text').textContent = this.getChartTitle(this.getAttribute("chart-type"));
        makeDraggable(this.cont);
        this.cont.style.zIndex = findHighestZIndex(); // Set the z-index to bring the window to the front
    }

    // Called when an observed attribute changes
    attributeChangedCallback(name, oldValue, newValue) {
        if (name === "data" && newValue != null){
            this.#dataValue = newValue; // Update the data value when the data attribute changes
            this.removeAttribute("data"); // Remove the attribute after processing
        }
        // this.render();
    }

    // Render the window chart's HTML structure
    render() {
        this.shadowRoot.innerHTML = `
            <style>
                window-chart {
                    display: block;
                    width: 100%;
                    height: 100%;
                }
                .window {
                    background: white;
                    border-radius: 10px;
                    box-shadow: 0px 5px 15px rgba(0, 0, 0, 0.2);
                    border: 1px solid #ccc;
                    display: flex;
                    flex-direction: column;
                    width: 100%;
                    height: 100%;
                }
                .content {
                    flex-grow: 1;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    overflow: hidden;
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
                }
                .close-btn {
                    width: 16px;
                    height: 16px;
                    background: red;
                    border-radius: 50%;
                    cursor: pointer;
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

    // Return a title based on the chart type
    getChartTitle(type) {
        switch (type) {
            case 'pie-chart': return 'Pie Chart';
            case 'bar-chart': return 'Bar Chart';
            case 'nodelink-chart': return 'NodeLink Diagram';
            case 'map-chart': return 'Map'
            default: return 'Chart';
        }
    };

    // Getter
    get dataValue() {
        return this.#dataValue;
    }

    // Setter
    set dataValue(data){
        this.#dataValue = data;
    }
}

// Function make an element draggable
function makeDraggable (element) {
    // Make an element draggable (or if it has a .window-top class, drag based on the .window-top element)
    let currentPosX = 0, currentPosY = 0, previousPosX = 0, previousPosY = 0;

    const windowChart = element.closest('window-chart'); // Find the closest window-chart parent element

		// If there is a window-top classed element, attach to that element instead of full window
    if (element.querySelector('#window-header')) {
        // If present, the window-top element is where you move the parent element from
        element.querySelector('#window-header').onmousedown = dragMouseDown;
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

        // Bring the window to front when dragging starts
        element.style.zIndex = findHighestZIndex() + 1;

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