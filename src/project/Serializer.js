/**
 * Serializer — converts project state to/from JSON.
 */
export class Serializer {
  constructor() {
    this.VERSION = 1;
  }

  serialize(state) {
    const nodes = state.get('nodes');
    const connections = state.get('connections');
    const serialNodes = [];
    for (const [, nd] of nodes) {
      serialNodes.push({ id: nd.id, type: nd.type, x: Math.round(nd.x), y: Math.round(nd.y), data: nd.data || {} });
    }
    return {
      version: this.VERSION,
      projectName: state.get('projectName') || 'Untitled',
      nodes: serialNodes,
      connections: connections.map(c => ({ id: c.id, fromNode: c.fromNode, fromPort: c.fromPort, toNode: c.toNode, toPort: c.toPort, type: c.type })),
    };
  }

  deserialize(json, state) {
    state.set('projectName', json.projectName || 'Untitled');
    const nodes = new Map();
    for (const nd of json.nodes || []) nodes.set(nd.id, nd);
    state.set('nodes', nodes);
    state.set('connections', json.connections || []);
    return { nodes: Array.from(nodes.values()), connections: json.connections || [] };
  }
}
