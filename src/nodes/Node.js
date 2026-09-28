/**
 * Node — creates the DOM representation of a node on the canvas.
 */
let _idCounter = 0;

export function generateNodeId() {
  return 'n' + (++_idCounter).toString(36) + '_' + Math.random().toString(36).slice(2, 6);
}

export class Node {
  constructor(def, data) {
    this.def = def;
    this.data = data;
    this.el = null;
  }

  render({ state, bus, camera, connections }) {
    const el = document.createElement('div');
    el.id = `node-${this.data.id}`;
    el.className = 'node';
    el.style.left = this.data.x + 'px';
    el.style.top = this.data.y + 'px';
    el.dataset.nodeId = this.data.id;

    const catColor = `var(--accent-${this.def.category})`;

    const header = document.createElement('div');
    header.className = 'node-header';
    header.style.background = catColor;
    header.innerHTML = `<span class="node-header-dot" style="background:${catColor}"></span><span>${this.def.name}</span>`;
    el.appendChild(header);

    const body = document.createElement('div');
    body.className = 'node-body';

    for (const inp of this.def.inputs || []) {
      const row = document.createElement('div');
      row.className = 'node-port-row node-input-row';
      const port = document.createElement('div');
      port.className = `node-port input${inp.type === 'exec' ? ' exec' : ''}`;
      port.dataset.port = inp.id;
      port.dataset.nodeId = this.data.id;
      port.dataset.direction = 'input';
      port.dataset.portType = inp.type;
      const label = document.createElement('span');
      label.className = 'node-port-label';
      label.textContent = inp.name;
      row.appendChild(port);
      row.appendChild(label);
      body.appendChild(row);
    }

    if (this.def.dataFields) {
      for (const field of this.def.dataFields) {
        const row = document.createElement('div');
        row.className = 'node-port-row';
        row.style.padding = '3px 10px';
        const input = document.createElement('input');
        input.className = 'node-value-input';
        input.type = field.inputType || 'text';
        input.value = this.data.data?.[field.id] ?? field.defaultValue ?? '';
        input.placeholder = field.placeholder || '';
        input.dataset.fieldId = field.id;
        input.addEventListener('input', () => {
          this.data.data = this.data.data || {};
          this.data.data[field.id] = field.inputType === 'number' ? (parseFloat(input.value) || 0) : input.value;
          bus.emit('node:data:changed', this.data.id);
        });
        row.appendChild(input);
        body.appendChild(row);
      }
    }

    for (const out of this.def.outputs || []) {
      const row = document.createElement('div');
      row.className = 'node-port-row node-output-row';
      const label = document.createElement('span');
      label.className = 'node-port-label';
      label.textContent = out.name;
      const port = document.createElement('div');
      port.className = `node-port output${out.type === 'exec' ? ' exec' : ''}`;
      port.dataset.port = out.id;
      port.dataset.nodeId = this.data.id;
      port.dataset.direction = 'output';
      port.dataset.portType = out.type;
      row.appendChild(label);
      row.appendChild(port);
      body.appendChild(row);
    }

    el.appendChild(body);
    this.el = el;

    this._bindDrag(el, state, bus, camera);
    this._bindPorts(el, state, bus, camera, connections);

    return el;
  }

  _bindDrag(el, state, bus, camera) {
    let dragging = false, startX, startY, origX, origY;
    el.addEventListener('mousedown', (e) => {
      if (e.target.classList.contains('node-port') || e.target.tagName === 'INPUT') return;
      if (e.button !== 0) return;
      e.stopPropagation();
      dragging = true;
      startX = e.clientX;
      startY = e.clientY;
      origX = this.data.x;
      origY = this.data.y;
      const onMove = (ev) => {
        if (!dragging) return;
        this.data.x = origX + (ev.clientX - startX) / camera.zoom;
        this.data.y = origY + (ev.clientY - startY) / camera.zoom;
        el.style.left = this.data.x + 'px';
        el.style.top = this.data.y + 'px';
        bus.emit('node:moved', this.data.id);
      };
      const onUp = () => {
        dragging = false;
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
      };
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    });
  }

  _bindPorts(el, state, bus, camera, connections) {
    function typesCompatible(a, b) {
      if (a === 'any' || b === 'any') return true;
      return a === b;
    }

    el.querySelectorAll('.node-port').forEach((port) => {
      port.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        const nodeId = this.data.id;
        const portId = port.dataset.port;
        const direction = port.dataset.direction;
        const portType = port.dataset.portType;

        // If this input port already has a connection, remove it first (disconnect on drag)
        if (direction === 'input') {
          const existing = state.get('connections').find(c => c.toNode === nodeId && c.toPort === portId);
          if (existing) {
            state.removeConnection(existing.id);
            bus.emit('console:log', 'Connection removed');
          }
        }
        // If dragging from an output that has connections, allow re-dragging (disconnect first connection)
        if (direction === 'output') {
          const existing = state.get('connections').find(c => c.fromNode === nodeId && c.fromPort === portId);
          if (existing) {
            state.removeConnection(existing.id);
            bus.emit('console:log', 'Connection removed');
          }
        }

        const startPos = connections._portWorldPos(nodeId, portId);
        connections.startTemp(startPos.x, startPos.y, portType);

        const onMove = (ev) => {
          const world = camera.screenToWorld(ev.clientX, ev.clientY);
          connections.updateTemp(world.x, world.y);
        };

        const onUp = (ev) => {
          connections.endTemp();
          window.removeEventListener('mousemove', onMove);
          window.removeEventListener('mouseup', onUp);
          const target = document.elementFromPoint(ev.clientX, ev.clientY);
          if (!target || !target.classList.contains('node-port')) return;
          if (target.dataset.direction === direction) return;
          if (!typesCompatible(portType, target.dataset.portType)) return;

          let connData;
          if (direction === 'output') {
            connData = { id: 'c_' + Math.random().toString(36).slice(2, 8), fromNode: nodeId, fromPort: portId, toNode: target.dataset.nodeId, toPort: target.dataset.port, type: portType === 'any' ? target.dataset.portType : portType };
          } else {
            connData = { id: 'c_' + Math.random().toString(36).slice(2, 8), fromNode: target.dataset.nodeId, fromPort: target.dataset.port, toNode: nodeId, toPort: portId, type: target.dataset.portType === 'any' ? portType : target.dataset.portType };
          }

          // Remove existing connection to this input port (only one connection per input)
          const existingInput = state.get('connections').find(c => c.toNode === connData.toNode && c.toPort === connData.toPort);
          if (existingInput) state.removeConnection(existingInput.id);

          const duplicate = state.get('connections').find(
            c => c.fromNode === connData.fromNode && c.fromPort === connData.fromPort && c.toNode === connData.toNode && c.toPort === connData.toPort
          );
          if (duplicate) return;

          state.addConnection(connData);
          bus.emit('console:log', 'Connection created');
        };

        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
      });
    });
  }

  setRunning(active) {
    if (this.el) this.el.classList.toggle('running', active);
  }

  destroy() {
    if (this.el && this.el.parentNode) this.el.remove();
  }
}
