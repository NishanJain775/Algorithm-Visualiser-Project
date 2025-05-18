class Graph {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.nodes = [];
        this.edges = [];
        this.isDragging = false;
        this.selectedNode = null;
        this.edgeStart = null;
        this.nodeRadius = 20;
        this.isAddingEdge = false;
        this.setupCanvas();
        this.setupEventListeners();
    }

    setupCanvas() {
        this.canvas.width = this.canvas.offsetWidth;
        this.canvas.height = this.canvas.offsetHeight;
        // Handle window resize
        window.addEventListener('resize', () => {
            this.canvas.width = this.canvas.offsetWidth;
            this.canvas.height = this.canvas.offsetHeight;
            this.draw();
        });
    }

    setupEventListeners() {
        this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
    }

    handleMouseDown(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const clickedNode = this.findNode(x, y);
        
        if (this.isAddingEdge) {
            if (clickedNode) {
                if (!this.edgeStart) {
                    this.edgeStart = clickedNode;
                    clickedNode.borderColor = '#2196F3'; // Highlight selected node
                    this.draw();
                } else if (clickedNode !== this.edgeStart) {
                    this.addEdge(this.edgeStart, clickedNode);
                    this.edgeStart.borderColor = '#333'; // Reset border color
                    this.edgeStart = null;
                    this.draw();
                }
            }
        } else {
            this.selectedNode = clickedNode;
            if (this.selectedNode) {
                this.isDragging = true;
            }
        }
    }

    handleMouseMove(e) {
        if (!this.isDragging || !this.selectedNode) return;
        
        const rect = this.canvas.getBoundingClientRect();
        this.selectedNode.x = e.clientX - rect.left;
        this.selectedNode.y = e.clientY - rect.top;
        this.draw();

        // Draw temporary edge line if adding edge
        if (this.isAddingEdge && this.edgeStart) {
            this.draw();
            this.ctx.beginPath();
            this.ctx.moveTo(this.edgeStart.x, this.edgeStart.y);
            this.ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
            this.ctx.strokeStyle = '#666';
            this.ctx.setLineDash([5, 5]); // Create dashed line
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
            this.ctx.setLineDash([]); // Reset to solid line
        }
    }

    handleMouseUp(e) {
        this.isDragging = false;
        this.selectedNode = null;
    }

    findNode(x, y) {
        return this.nodes.find(node => {
            const dx = node.x - x;
            const dy = node.y - y;
            return Math.sqrt(dx * dx + dy * dy) <= this.nodeRadius;
        });
    }

    addNode(x, y) {
        const node = {
            id: this.nodes.length,
            x,
            y,
            color: '#fff',
            borderColor: '#333'
        };
        this.nodes.push(node);
        this.draw();
    }

    addEdge(start, end) {
        if (!this.edges.some(edge => 
            (edge.start === start && edge.end === end) ||
            (edge.start === end && edge.end === start)
        )) {
            this.edges.push({ start, end });
            this.draw();
        }
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw edges
        this.edges.forEach(edge => {
            this.ctx.beginPath();
            this.ctx.moveTo(edge.start.x, edge.start.y);
            this.ctx.lineTo(edge.end.x, edge.end.y);
            this.ctx.strokeStyle = '#666';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
        });
        
        // Draw nodes
        this.nodes.forEach(node => {
            this.ctx.beginPath();
            this.ctx.arc(node.x, node.y, this.nodeRadius, 0, Math.PI * 2);
            this.ctx.fillStyle = node.color;
            this.ctx.fill();
            this.ctx.strokeStyle = node.borderColor;
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
            
            // Draw node ID
            this.ctx.fillStyle = '#000';
            this.ctx.font = '14px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(node.id, node.x, node.y);
        });
    }

    async bfs(startNode) {
        const visited = new Set();
        const queue = [startNode];
        visited.add(startNode);

        while (queue.length > 0) {
            const current = queue.shift();
            current.color = '#ffeb3b';
            this.draw();
            await new Promise(resolve => setTimeout(resolve, 1000));

            const neighbors = this.edges
                .filter(edge => edge.start === current || edge.end === current)
                .map(edge => edge.start === current ? edge.end : edge.start);

            for (const neighbor of neighbors) {
                if (!visited.has(neighbor)) {
                    visited.add(neighbor);
                    queue.push(neighbor);
                }
            }

            current.color = '#4CAF50';
            this.draw();
        }
    }

    async dfs(startNode, visited = new Set()) {
        visited.add(startNode);
        startNode.color = '#ffeb3b';
        this.draw();
        await new Promise(resolve => setTimeout(resolve, 1000));

        const neighbors = this.edges
            .filter(edge => edge.start === startNode || edge.end === startNode)
            .map(edge => edge.start === startNode ? edge.end : edge.start);

        for (const neighbor of neighbors) {
            if (!visited.has(neighbor)) {
                await this.dfs(neighbor, visited);
            }
        }

        startNode.color = '#4CAF50';
        this.draw();
    }

    clear() {
        this.nodes = [];
        this.edges = [];
        this.draw();
    }

    resetColors() {
        this.nodes.forEach(node => {
            node.color = '#fff';
            node.borderColor = '#333';
        });
        this.draw();
    }
}

// Initialize the graph
const canvas = document.getElementById('graphCanvas');
const graph = new Graph(canvas);

// Global state
let addEdgeMode = false;

// Event listeners for buttons
document.getElementById('addNodeBtn').addEventListener('click', () => {
    graph.isAddingEdge = false;
    canvas.style.cursor = 'pointer';
    if (graph.edgeStart) {
        graph.edgeStart.borderColor = '#333';
        graph.edgeStart = null;
        graph.draw();
    }
    canvas.onclick = (e) => {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        if (!graph.findNode(x, y)) {
            graph.addNode(x, y);
        }
    };
});

document.getElementById('addEdgeBtn').addEventListener('click', () => {
    graph.isAddingEdge = true;
    canvas.style.cursor = 'crosshair';
    canvas.onclick = null;
    if (graph.edgeStart) {
        graph.edgeStart.borderColor = '#333';
        graph.edgeStart = null;
        graph.draw();
    }
});

document.getElementById('clearBtn').addEventListener('click', () => {
    graph.clear();
});

document.getElementById('visualizeBtn').addEventListener('click', async () => {
    const algorithm = document.getElementById('algorithm').value;
    if (graph.nodes.length === 0) return;

    graph.resetColors();
    const startNode = graph.nodes[0];

    if (algorithm === 'bfs') {
        await graph.bfs(startNode);
    } else if (algorithm === 'dfs') {
        await graph.dfs(startNode);
    }
}); 