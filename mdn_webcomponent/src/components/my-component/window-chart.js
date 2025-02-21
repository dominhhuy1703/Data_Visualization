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
        const data = this.getAttribute('data');
        
        if (!data) {
            console.error('Data is missing or invalid');
            return; // Không tiếp tục nếu không có dữ liệu hợp lệ
        }

        let graph = document.createElement(this.getAttribute("chart-type"));
        this.shadowRoot.querySelector('.content').appendChild(graph);
        graph.setAttribute('data', data); // Truyền dữ liệu hợp lệ vào graph

        // Cập nhật title dựa trên loại chart
        this.shadowRoot.querySelector('#title-text').textContent = this.getChartTitle(this.getAttribute("chart-type"));
        
        // Thêm sự kiện đóng cửa sổ
        this.shadowRoot.querySelector('.close-btn').addEventListener('click', () => {
            this.remove();
        });

        // Kích hoạt tính năng kéo thả cửa sổ
        makeDraggable(this.cont);
    }

    attributeChangedCallback(name, oldValue, newValue) {
        console.log(`window received ${name}:`, newValue);
    }

    render() {
        this.shadowRoot.innerHTML = `
            <link rel="stylesheet" href="components/my-component/my-component.css">
            
            <div class="window" id='window-container'>
                <div class="title-bar" id='window-header'>
                    <span id="title-text"></span>
                    <div class="close-btn">X</div>
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
            case 'map-chart': return 'Map';
            default: return 'Chart';
        }
    };
}

function makeDraggable(element) {
    let currentPosX = 0, currentPosY = 0, previousPosX = 0, previousPosY = 0;

    // Nếu có window-top class, sử dụng nó để di chuyển cửa sổ
    if (element.querySelector('.window-header')) {
        element.querySelector('.window-header').onmousedown = dragMouseDown;
    }
    else {
        element.onmousedown = dragMouseDown;
    }

    function dragMouseDown(e) {
        e.preventDefault();
        previousPosX = e.clientX;
        previousPosY = e.clientY;
        document.onmouseup = closeDragElement;
        document.onmousemove = elementDrag;
    }

    function elementDrag(e) {
        e.preventDefault();
        currentPosX = previousPosX - e.clientX;
        currentPosY = previousPosY - e.clientY;
        previousPosX = e.clientX;
        previousPosY = e.clientY;
        element.style.top = (element.offsetTop - currentPosY) + 'px';
        element.style.left = (element.offsetLeft - currentPosX) + 'px';
    }

    function closeDragElement() {
        document.onmouseup = null;
        document.onmousemove = null;
    }
}

customElements.define('window-chart', WindowChart);
