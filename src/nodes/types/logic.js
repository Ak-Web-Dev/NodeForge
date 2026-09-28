/**
 * Logic nodes — conditionals and boolean ops.
 */
const reg = (def) => globalThis.__nf_registry?.register(def);

reg({
  type: 'logic.if',
  name: 'If',
  category: 'logic',
  inputs: [{ id: 'exec', name: '←', type: 'exec' }, { id: 'condition', name: 'Cond', type: 'boolean' }],
  outputs: [{ id: 'true', name: 'True →', type: 'exec' }, { id: 'false', name: 'False →', type: 'exec' }],
  execute(ctx) { ctx.triggerOutput(ctx.getInput('condition') ? 'true' : 'false'); },
});

reg({
  type: 'logic.compare',
  name: 'Compare',
  category: 'logic',
  inputs: [{ id: 'a', name: 'A', type: 'any' }, { id: 'b', name: 'B', type: 'any' }],
  outputs: [{ id: 'result', name: 'Result', type: 'boolean' }],
  dataFields: [{ id: 'op', inputType: 'text', defaultValue: '==', placeholder: '== != > < >= <=' }],
  execute(ctx) {
    const a = ctx.getInput('a'), b = ctx.getInput('b'), op = ctx.getData('op') || '==';
    let r;
    switch (op) {
      case '==': r = a == b; break;
      case '!=': r = a != b; break;
      case '>':  r = a > b; break;
      case '<':  r = a < b; break;
      case '>=': r = a >= b; break;
      case '<=': r = a <= b; break;
      default:   r = a == b;
    }
    ctx.setOutput('result', r);
  },
});

reg({
  type: 'logic.and',
  name: 'AND',
  category: 'logic',
  inputs: [{ id: 'a', name: 'A', type: 'boolean' }, { id: 'b', name: 'B', type: 'boolean' }],
  outputs: [{ id: 'result', name: 'Result', type: 'boolean' }],
  execute(ctx) { ctx.setOutput('result', !!(ctx.getInput('a') && ctx.getInput('b'))); },
});

reg({
  type: 'logic.or',
  name: 'OR',
  category: 'logic',
  inputs: [{ id: 'a', name: 'A', type: 'boolean' }, { id: 'b', name: 'B', type: 'boolean' }],
  outputs: [{ id: 'result', name: 'Result', type: 'boolean' }],
  execute(ctx) { ctx.setOutput('result', !!(ctx.getInput('a') || ctx.getInput('b'))); },
});

reg({
  type: 'logic.not',
  name: 'NOT',
  category: 'logic',
  inputs: [{ id: 'a', name: 'Value', type: 'boolean' }],
  outputs: [{ id: 'result', name: 'Result', type: 'boolean' }],
  execute(ctx) { ctx.setOutput('result', !ctx.getInput('a')); },
});
