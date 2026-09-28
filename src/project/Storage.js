/**
 * Storage — localStorage persistence + file import/export.
 */
const STORAGE_KEY = 'nodeforge_project';

export class Storage {
  save(data) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); return true; }
    catch { return false; }
  }

  load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }

  clear() { localStorage.removeItem(STORAGE_KEY); }

  exportFile(data, filename = 'project.nodeforge') {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  importFile() {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.nodeforge,.json';
      input.onchange = () => {
        const file = input.files[0];
        if (!file) return resolve(null);
        const reader = new FileReader();
        reader.onload = () => { try { resolve({ data: JSON.parse(reader.result), name: file.name }); } catch { resolve(null); } };
        reader.readAsText(file);
      };
      input.click();
    });
  }
}
