class Node {
    id: string;
    label: string;

    constructor(id: string, label: string) {
        this.id = id;
        this.label = label;
    }
}

class Edge {
    from: string;
    to: string;

    constructor(from: string, to: string) {
        this.from = from;
        this.to = to;
    }
}

export class Langraph {
    private nodes: Node[] = [];
    private edges: Edge[] = [];

    addNode(id: string, label: string): void {
        const newNode = new Node(id, label);
        this.nodes.push(newNode);
    }

    addEdge(from: string, to: string): void {
        const newEdge = new Edge(from, to);
        this.edges.push(newEdge);
    }

    renderGraph(): void {
        // Implementation for rendering the graph goes here
    }
}