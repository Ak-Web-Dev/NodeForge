/**
 * NodeRegistry — central registry of all node types.
 */
export class NodeRegistry {
  constructor() {
    this._types = new Map();
    this._categories = new Map();
  }

  register(def) {
    this._types.set(def.type, def);
    if (!this._categories.has(def.category)) {
      this._categories.set(def.category, []);
    }
    this._categories.get(def.category).push(def);
  }

  get(type) {
    return this._types.get(type);
  }

  getCategories() {
    return this._categories;
  }

  search(query) {
    const q = query.toLowerCase();
    const results = [];
    for (const [, def] of this._types) {
      if (def.name.toLowerCase().includes(q) || def.type.toLowerCase().includes(q)) {
        results.push(def);
      }
    }
    return results;
  }
}
