const path = require('path');
const Promise = require('bluebird');
const postcss = require('postcss');
const pluginName = require('../package.json').name;
const utils = require('./utils');

const defaultOptions = {
  queryParam: 'scale',
  dropIfEmpty: true
};

const plugin = postcss.plugin('postcss-aspect-ratio-from-background-image', (opts) => {
  const options = opts || {};
  const queryParam = typeof options.queryParam !== 'undefined' ? options.queryParam : defaultOptions.queryParam;
  const dropIfEmpty = typeof options.dropIfEmpty === 'boolean' ? options.dropIfEmpty : defaultOptions.dropIfEmpty;

  return function (root) {
    const from = root.source.input.file;
    var promises = [];

    if (!from) {
      throw new Error('`from` option should be defined to proper images resolving');
    }

    root.walkDecls('background-image', (decl) => { // eslint-disable-line consistent-return
      const rule = decl.parent;
      const url = utils.getURL(decl.value);
      if (!url || (queryParam !== false && !url.hasQuery(queryParam))) {
        return null;
      }

      const imagePath = path.resolve(path.dirname(from), url.path());
      const promise = utils.getAspectRatio(imagePath)
        .then((aspectRatio) => {
          const aspectRatioString = `${Math.round(aspectRatio * 100)}%`;

          rule
            .cloneAfter({ selector: utils.transformSelector(rule.selector) })
            .removeAll()
            .append(
              { prop: decl.prop, value: decl.value },
              { prop: 'padding-bottom', value: aspectRatioString }
            );

          decl.remove();

          if (rule.nodes.length === 0 && dropIfEmpty) {
            rule.remove();
          }
        })
        .catch((error) => {
          var message = error.message;

          if (error.message === 'fd must be a file descriptor') {
            message = `File ${imagePath} not found`;
          }

          throw decl.error(message, { plugin: pluginName });
        });

      promises.push(promise);
    });

    return Promise.all(promises);
  };
});

module.exports = plugin;
module.exports.defaultOptions = defaultOptions;
