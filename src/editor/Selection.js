/**
 * Selection — node selection, multi-select, and drag selection box.
 */
export class Selection {
  constructor(state, bus, canvas) {
    this.state = state;
    this.bus = bus;
    this.canvas = canvas;
    this._box = null;
    this._start = null;
    this._init();
  }

  _init() {
    const c = this.canvas.container;

    c.addEventListener('mousedown', (e) => {
      if (e.target.closest('.node')) return;
      if (e.button !== 0) return;
      if (!e.shiftKey) this.deselectAll();
      this._start = { x: e.clientX, y: e.clientY };
      this._box = document.createElement('div');
      this._box.className = 'selection-box';
      c.appendChild(this._box);
    });

    window.addEventListener('mousemove', (e) => {
      if (!this._start || !this._box) return;
      const rect = this.canvas.getRect();
      const sx = Math.min(this._start.x, e.clientX) - rect.left;
      const sy = Math.min(this._start.y, e.clientY) - rect.top;
      const ex = Math.max(this._start.x, e.clientX) - rect.left;
      const ey = Math.max(this._start.y, e.clientY) - rect.top;
      Object.assign(this._box.style, { left: sx + 'px', top: sy + 'px', width: (ex - sx) + 'px', height: (ey - sy) + 'px' });
    });

    window.addEventListener('mouseup', (e) => {
      if (!this._start || !this._box) return;
      const screenRect = {
        left: Math.min(this._start.x, e.clientX),
        top: Math.min(this._start.y, e.clientY),
        right: Math.max(this._start.x, e.clientX),
        bottom: Math.max(this._start.y, e.clientY),
      };
      this._selectInBox(screenRect);
      this._box.remove();
      this._box = null;
      this._start = null;
    });
  }

  _selectInBox(sr) {
    const nodes = this.state.get('nodes');
    const selected = new Set(this.state.get('selectedNodeIds'));
    for (const [id] of nodes) {
      const el = document.getElementById(`node-${id}`);
      if (!el) continue;
      const r = el.getBoundingClientRect();
      if (r.left < sr.right && r.right > sr.left && r.top < sr.bottom && r.bottom > sr.top) {
        selected.add(id);
        el.classList.add('selected');
      }
    }
    this.state.set('selectedNodeIds', selected);
    this.bus.emit('selection:changed', selected);
  }

  select(id) {
    const selected = new Set(this.state.get('selectedNodeIds'));
    selected.add(id);
    this.state.set('selectedNodeIds', selected);
    const el = document.getElementById(`node-${id}`);
    if (el) el.classList.add('selected');
    this.bus.emit('selection:changed', selected);
  }

  deselect(id) {
    const selected = new Set(this.state.get('selectedNodeIds'));
    selected.delete(id);
    this.state.set('selectedNodeIds', selected);
    const el = document.getElementById(`node-${id}`);
    if (el) el.classList.remove('selected');
    this.bus.emit('selection:changed', selected);
  }

  deselectAll() {
    for (const id of this.state.get('selectedNodeIds')) {
      const el = document.getElementById(`node-${id}`);
      if (el) el.classList.remove('selected');
    }
    this.state.set('selectedNodeIds', new Set());
    this.bus.emit('selection:changed', new Set());
  }

  isSelected(id) {
    return this.state.get('selectedNodeIds').has(id);
  }
}
