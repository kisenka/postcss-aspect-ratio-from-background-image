const path = require('path');
const Promise = require('bluebird');
const postcss = require('postcss');
const parseValues = require('postcss-value-parser');
const pluginName = require('../package.json').name;
const utils = require('./utils');
const URL = require('url-parse');

const defaultOptions = {
  funcName: 'ratio',
  queryParam: 'scale',
  dropIfEmpty: true
};

module.exports = postcss.plugin('postcss-aspect-ratio-from-background-image', (opts) => {
  const options = opts || {};
  const queryParam = typeof options.queryParam !== 'undefined' ? options.queryParam : defaultOptions.queryParam;
  const dropIfEmpty = typeof options.dropIfEmpty === 'boolean' ? options.dropIfEmpty : defaultOptions.dropIfEmpty;
  const funcName = options.funcName || defaultOptions.funcName;

  return function plugin(root) {
    const from = root.source.input.file;
    const context = path.dirname(from);
    var promises = [];

    if (!from) {
      throw new Error('`from` option should be defined for proper file resolving');
    }

    root.walkDecls((decl) => { // eslint-disable-line consistent-return
      const name = decl.prop;
      const value = decl.value;
      const rule = decl.parent;
      const isBackground = /^background(-image)?$/.test(name);
      var imagePath;

      var tree = parseValues(value);
      var targetNode = utils.findFunctionNode(tree, isBackground ? 'url' : funcName);
      if (!targetNode.node || !targetNode.value) {
        return;
      }

      imagePath = targetNode.value;

      if (isBackground) {
        const url = new URL(targetNode.value, true);
        if (!url || (queryParam !== false && !(queryParam in url.query))) {
          return;
        }
        imagePath = url.pathname;
      }

      const promise = utils.resolveFile(imagePath, context)
        .then(filePath => utils.getAspectRatio(filePath))
        .then((aspectRatio) => {
          const aspectRatioString = `${Math.round(aspectRatio * 100)}%`;

          if (isBackground) {
            rule
              .cloneBefore({ selector: utils.transformSelector(rule.selector) })
              .removeAll()
              .append(
                { prop: name, value: value },
                { prop: 'padding-bottom', value: aspectRatioString }
              );

            decl.remove();

            if (rule.nodes.length === 0 && dropIfEmpty) {
              rule.remove();
            }
          } else {
            tree.nodes[tree.nodes.indexOf(targetNode.node)] = {
              sourceIndex: targetNode.node.sourceIndex,
              type: 'word',
              value: aspectRatioString
            };
            decl.value = tree.toString();
          }
        })
        .catch((error) => {
          throw decl.error(error.message, { plugin: pluginName });
        });

      promises.push(promise);
    });

    return Promise.all(promises);
  };
});
