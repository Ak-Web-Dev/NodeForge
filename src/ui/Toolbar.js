/**
 * Toolbar — top toolbar with File, Edit, View, Run controls.
 */
export class Toolbar {
  constructor(state, bus) {
    this.state = state;
    this.bus = bus;
    this.el = document.getElementById('toolbar');
    this._init();
  }

  _init() {
    this.el.innerHTML = `
      <span class="toolbar-brand">⚡ NodeForge</span>
      <button class="toolbar-btn" data-action="new">New</button>
      <button class="toolbar-btn" data-action="export-file">Export</button>
      <button class="toolbar-btn" data-action="import-file">Import</button>
      <button class="toolbar-btn" data-action="show-tutorial">?</button>
      <span class="toolbar-separator"></span>
      <button class="toolbar-btn" data-action="undo">Undo</button>
      <button class="toolbar-btn" data-action="redo">Redo</button>
      <span class="toolbar-separator"></span>
      <button class="toolbar-btn" data-action="run">▶ Run</button>
      <button class="toolbar-btn" data-action="stop">■ Stop</button>
      <span class="toolbar-separator"></span>
      <button class="toolbar-btn" data-action="view-code">&lt;/&gt; View Code</button>
      <button class="toolbar-btn" data-action="playground-toggle">Playground</button>
      <a href="index.html" class="toolbar-btn" style="text-decoration:none">← Back</a>
      <span class="toolbar-spacer"></span>
      <span id="project-name" style="color:var(--text-muted);font-size:var(--font-size-sm)">${this.state.get('projectName')}</span>
    `;

    this.el.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (btn) this.bus.emit('action:' + btn.dataset.action);
    });

    this.bus.on('state:projectName', (name) => {
      const el = this.el.querySelector('#project-name');
      if (el) el.textContent = name;
    });
  }
}
