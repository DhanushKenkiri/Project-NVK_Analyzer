import { Langraph } from './langraph';

const app = new Langraph();

// Example usage
app.addNode({ id: '1', label: 'Node 1' });
app.addNode({ id: '2', label: 'Node 2' });
app.addEdge({ from: '1', to: '2' });
app.renderGraph();