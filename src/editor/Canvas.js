/**
 * Canvas — infinite node editor surface. Handles pan, zoom, grid, drag-drop.
 */
export class Canvas {
  constructor(state, bus, camera) {
    this.state = state;
    this.bus = bus;
    this.camera = camera;
    this.el = document.getElementById('canvas');
    this.container = document.getElementById('canvas-container');
    this._isPanning = false;
    this._panStart = null;
    this._init();
  }

  _init() {
    this._bindPanZoom();
    this._bindDrop();
    this._renderGrid();
  }

  _bindPanZoom() {
    const c = this.container;

    c.addEventListener('mousedown', (e) => {
      if (e.target.closest('.node')) return;
      if (e.button === 1 || (e.button === 0 && e.target === this.el)) {
        this._isPanning = true;
        this._panStart = { x: e.clientX, y: e.clientY };
        c.classList.add('panning');
        e.preventDefault();
      }
    });

    window.addEventListener('mousemove', (e) => {
      if (!this._isPanning) return;
      const dx = e.clientX - this._panStart.x;
      const dy = e.clientY - this._panStart.y;
      this._panStart = { x: e.clientX, y: e.clientY };
      this.camera.pan(dx, dy);
      this.camera.apply();
      this._updateGrid();
      this.bus.emit('canvas:pan');
    });

    window.addEventListener('mouseup', () => {
      if (this._isPanning) {
        this._isPanning = false;
        this.container.classList.remove('panning');
      }
    });

    c.addEventListener('wheel', (e) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.08 : 0.08;
      this.camera.zoomAt(e.clientX, e.clientY, delta);
      this.camera.apply();
      this._updateGrid();
    }, { passive: false });
  }

  _bindDrop() {
    this.container.addEventListener('dragover', (e) => e.preventDefault());
    this.container.addEventListener('drop', (e) => {
      e.preventDefault();
      const type = e.dataTransfer.getData('node-type');
      if (!type) return;
      const world = this.camera.screenToWorld(e.clientX, e.clientY);
      this.bus.emit('node:create', type, world.x, world.y);
    });
  }

  _renderGrid() {
    this._updateGrid();
    this._gridInterval = setInterval(() => this._updateGrid(), 80);
  }

  _updateGrid() {
    const s = this.camera.zoom;
    const gs = 20 * s;
    this.container.style.backgroundImage = 'radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)';
    this.container.style.backgroundSize = `${gs}px ${gs}px`;
    this.container.style.backgroundPosition = `${this.camera.x}px ${this.camera.y}px`;
  }

  appendNode(el) {
    this.el.appendChild(el);
  }

  getRect() {
    return this.container.getBoundingClientRect();
  }
}
