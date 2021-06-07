const Module = require('module');
const DepGraph = require('dependency-graph').DepGraph;

const graph = new DepGraph();
const __require = Module.prototype.require;

Module.prototype.require = function(path) {
  const requiredModule = __require.call(this, path);
  const requiredModuleFilename = Module._resolveFilename(path, this);
  graph.addNode(this.filename);
  graph.addNode(requiredModuleFilename);
  graph.addDependency(this.filename, requiredModuleFilename);
  return requiredModule;
};

function invalidate(absPathToModule) {
  if (graph.hasNode(absPathToModule)) {
    graph.dependantsOf(absPathToModule).concat([absPathToModule]).forEach(m => {
      const mod = require.cache[m];
      if (mod) {
        const siblings = mod.parent.children.indexOf(mod);
        if (siblings >= 0) {
          mod.parent.children.splice(siblings, 1);
        }
      }

      delete require.cache[m];

      graph.removeNode(m);
    });
  }
}

module.exports = invalidate;
