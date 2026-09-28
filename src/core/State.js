/**
 * State — centralised application state store.
 */
export class State {
  constructor(bus) {
    this.bus = bus;
    this._data = {
      nodes: new Map(),
      connections: [],
      selectedNodeIds: new Set(),
      projectName: 'Untitled',
      projectVersion: 1,
      isRunning: false,
      undoStack: [],
      redoStack: [],
    };
  }

  get(key) {
    return this._data[key];
  }

  set(key, value) {
    const prev = this._data[key];
    this._data[key] = value;
    this.bus.emit('state:change', { key, value, prev });
    this.bus.emit(`state:${key}`, value, prev);
  }

  addNode(nodeData) {
    const nodes = new Map(this._data.nodes);
    nodes.set(nodeData.id, nodeData);
    this.set('nodes', nodes);
    this.bus.emit('node:created', nodeData);
  }

  removeNode(id) {
    const nodes = new Map(this._data.nodes);
    const removed = nodes.get(id);
    nodes.delete(id);
    this.set('nodes', nodes);
    if (removed) this.bus.emit('node:removed', removed);
  }

  addConnection(conn) {
    const conns = [...this._data.connections, conn];
    this.set('connections', conns);
    this.bus.emit('connection:created', conn);
  }

  removeConnection(connId) {
    const conns = this._data.connections.filter(c => c.id !== connId);
    this.set('connections', conns);
    this.bus.emit('connection:removed', connId);
  }
}
