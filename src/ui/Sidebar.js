/**
 * Sidebar — Node Library with categories, search, and drag-to-create.
 */
export class Sidebar {
  constructor(state, bus, registry, canvas) {
    this.state = state;
    this.bus = bus;
    this.registry = registry;
    this.canvas = canvas;
    this.el = document.getElementById('sidebar');
    this._init();
  }

  _init() {
    const cats = this.registry.getCategories();
    const labels = { events: 'Events', data: 'Data', math: 'Math', logic: 'Logic', flow: 'Flow', web: 'Web' };

    let html = `<div class="sidebar-header"><input class="sidebar-search" placeholder="Search nodes..." id="node-search" /></div><div class="sidebar-content" id="sidebar-list">`;
    for (const [cat, nodes] of cats) {
      html += `<div class="sidebar-category" data-cat="${cat}"><div class="sidebar-category-header"><span class="sidebar-category-dot" style="background:${cat === 'events' ? '#000000' : `var(--accent-${cat})`}"></span>${labels[cat] || cat}</div>`;
      for (const def of nodes) {
        html += `<div class="sidebar-node-item" draggable="true" data-type="${def.type}">${def.name}</div>`;
      }
      html += '</div>';
    }
    html += '</div>';
    this.el.innerHTML = html;

    this.el.addEventListener('dragstart', (e) => {
      const item = e.target.closest('.sidebar-node-item');
      if (item) {
        e.dataTransfer.setData('node-type', item.dataset.type);
        e.dataTransfer.effectAllowed = 'copy';
      }
    });

    this.el.addEventListener('dblclick', (e) => {
      const item = e.target.closest('.sidebar-node-item');
      if (!item) return;
      const rect = this.canvas.getRect();
      const world = this.canvas.camera.screenToWorld(rect.left + rect.width / 2, rect.top + rect.height / 2);
      this.bus.emit('node:create', item.dataset.type, world.x, world.y);
    });

    this.el.querySelector('#node-search').addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase();
      this.el.querySelectorAll('.sidebar-node-item').forEach(item => {
        item.style.display = item.textContent.toLowerCase().includes(q) ? '' : 'none';
      });
      this.el.querySelectorAll('.sidebar-category').forEach(cat => {
        const vis = cat.querySelectorAll('.sidebar-node-item:not([style*="display: none"])');
        cat.style.display = vis.length ? '' : 'none';
      });
    });
  }
}
