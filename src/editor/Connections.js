/**
 * Connections — SVG bezier connection rendering between node ports.
 */
export class Connections {
  constructor(state, bus, camera) {
    this.state = state;
    this.bus = bus;
    this.camera = camera;
    this.svg = document.getElementById('connections-svg');
    this._tempLine = null;
    this.bus.on('connection:created', () => this.render());
    this.bus.on('connection:removed', () => this.render());
    this.bus.on('node:moved', () => this.render());
    this.bus.on('canvas:pan', () => this.render());
  }

  _portWorldPos(nodeId, portId) {
    const nodeEl = document.getElementById(`node-${nodeId}`);
    if (!nodeEl) return { x: 0, y: 0 };
    const portEl = nodeEl.querySelector(`[data-port="${portId}"]`);
    if (!portEl) return { x: 0, y: 0 };
    const nd = this.state.get('nodes').get(nodeId);
    if (!nd) return { x: 0, y: 0 };
    const nodeRect = nodeEl.getBoundingClientRect();
    const portRect = portEl.getBoundingClientRect();
    return {
      x: nd.x + (portRect.left + portRect.width / 2 - nodeRect.left) / this.camera.zoom,
      y: nd.y + (portRect.top + portRect.height / 2 - nodeRect.top) / this.camera.zoom,
    };
  }

  _bezierPath(x1, y1, x2, y2) {
    const dx = Math.max(Math.abs(x2 - x1) * 0.5, 50);
    return `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
  }

  render() {
    this.svg.querySelectorAll('path.conn').forEach(p => p.remove());
    // Clear all connected classes first
    document.querySelectorAll('.node-port.connected').forEach(p => p.classList.remove('connected'));
    const conns = this.state.get('connections');
    for (const conn of conns) {
      const from = this._portWorldPos(conn.fromNode, conn.fromPort);
      const to = this._portWorldPos(conn.toNode, conn.toPort);
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', this._bezierPath(from.x, from.y, to.x, to.y));
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', conn.type === 'exec' ? 'var(--conn-exec)' : 'var(--conn-data)');
      path.setAttribute('stroke-width', '2.5');
      path.setAttribute('class', 'conn');
      path.dataset.connId = conn.id;
      path.style.pointerEvents = 'stroke';
      path.style.cursor = 'pointer';
      path.addEventListener('click', (e) => {
        e.stopPropagation();
        this.bus.emit('connection:delete', conn.id);
      });
      this.svg.appendChild(path);
      // Mark ports as connected
      const fromPort = document.querySelector(`[data-node-id="${conn.fromNode}"][data-port="${conn.fromPort}"]`);
      const toPort = document.querySelector(`[data-node-id="${conn.toNode}"][data-port="${conn.toPort}"]`);
      if (fromPort) fromPort.classList.add('connected');
      if (toPort) toPort.classList.add('connected');
    }
  }

  startTemp(x1, y1, type) {
    this._tempLine = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    this._tempLine.setAttribute('fill', 'none');
    this._tempLine.setAttribute('stroke', type === 'exec' ? 'var(--conn-exec)' : 'var(--conn-data)');
    this._tempLine.setAttribute('stroke-width', '2');
    this._tempLine.setAttribute('stroke-dasharray', '6 4');
    this._tempLine.setAttribute('pointer-events', 'none');
    this._tempLine._x1 = x1;
    this._tempLine._y1 = y1;
    this.svg.appendChild(this._tempLine);
  }

  updateTemp(x2, y2) {
    if (!this._tempLine) return;
    this._tempLine.setAttribute('d', this._bezierPath(this._tempLine._x1, this._tempLine._y1, x2, y2));
  }

  endTemp() {
    if (this._tempLine) { this._tempLine.remove(); this._tempLine = null; }
  }
}
