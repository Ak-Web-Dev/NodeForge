/**
 * ConsolePanel — bottom console/status area for messages.
 */
export class ConsolePanel {
  constructor(bus) {
    this.bus = bus;
    this.el = document.getElementById('console-panel');
    this._init();
  }

  _init() {
    this.el.innerHTML = `
      <div class="console-header"><span>Console</span><span class="toolbar-spacer"></span><button class="toolbar-btn" id="console-clear" style="font-size:10px">Clear</button></div>
      <div class="console-content" id="console-output"></div>`;
    this.output = this.el.querySelector('#console-output');
    this.el.querySelector('#console-clear').addEventListener('click', () => { this.output.innerHTML = ''; });

    const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const append = (msg, cls) => {
      const line = document.createElement('div');
      line.className = `console-line ${cls}`;
      line.innerHTML = `<span class="msg">NodeForge&gt; ${esc(msg)}</span>`;
      this.output.appendChild(line);
      this.output.scrollTop = this.output.scrollHeight;
    };

    this.bus.on('console:log', (m) => append(m, ''));
    this.bus.on('console:error', (m) => append(m, 'error'));
    this.bus.on('console:warn', (m) => append(m, 'warn'));
    this.bus.on('console:success', (m) => append(m, 'success'));
  }
}
