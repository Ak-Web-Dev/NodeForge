/**
 * Camera — virtual viewport camera. Handles pan, zoom, screen↔world conversion.
 */
export class Camera {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.zoom = 1;
    this.minZoom = 0.15;
    this.maxZoom = 3;
  }

  screenToWorld(sx, sy) {
    const rect = document.getElementById('canvas-container').getBoundingClientRect();
    return {
      x: (sx - rect.left - this.x) / this.zoom,
      y: (sy - rect.top - this.y) / this.zoom,
    };
  }

  worldToScreen(wx, wy) {
    const rect = document.getElementById('canvas-container').getBoundingClientRect();
    return {
      x: wx * this.zoom + this.x + rect.left,
      y: wy * this.zoom + this.y + rect.top,
    };
  }

  pan(dx, dy) {
    this.x += dx;
    this.y += dy;
  }

  zoomAt(clientX, clientY, delta) {
    const rect = document.getElementById('canvas-container').getBoundingClientRect();
    const mx = clientX - rect.left;
    const my = clientY - rect.top;
    const prev = this.zoom;
    this.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.zoom * (1 + delta)));
    const scale = this.zoom / prev;
    this.x = mx - (mx - this.x) * scale;
    this.y = my - (my - this.y) * scale;
  }

  centreOn(wx, wy) {
    const rect = document.getElementById('canvas-container').getBoundingClientRect();
    this.x = rect.width / 2 - wx * this.zoom;
    this.y = rect.height / 2 - wy * this.zoom;
  }

  apply() {
    const canvas = document.getElementById('canvas');
    const svg = document.getElementById('connections-svg');
    const t = `translate(${this.x}px, ${this.y}px) scale(${this.zoom})`;
    if (canvas) canvas.style.transform = t;
    if (svg) svg.style.transform = t;
  }
}
