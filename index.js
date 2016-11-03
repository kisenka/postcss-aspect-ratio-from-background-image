const path = require('path');
const Promise = require('bluebird');
const postcss = require('postcss');
const createUrlsHelper = require('postcss-helpers').createUrlsHelper;
const calipers = require('calipers')('svg');
const pluginName = require('./package.json').name;

/**
 * @param {String} selector
 * @returns {String}
 */
function transformSelector(selector) {
  return selector.split(',')
    .map(s => `${s}:after`)
    .join(',');
}

/**
 * @param {String} value
 * @param {Function} [filter]
 * @returns {URI|null}
 */
function getURL(value, filter) {
  var url = null;
  const URLs = createUrlsHelper(value).URIS;

  if (URLs.length > 0) {
    url = typeof filter === 'function' ? URLs.filter(filter)[0] : URLs[0];
  }

  return url;
}

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
      const url = getURL(decl.value);
      if (!url || (queryParam !== false && !url.hasQuery(queryParam))) {
        return null;
      }

      const imagePath = path.resolve(path.dirname(from), url.path());
      const promise = calipers.measure(imagePath)
        .then((data) => {
          const dimensions = data.pages[0];
          const aspectRatio = dimensions.height / dimensions.width;
          const aspectRatioString = `${Math.round(aspectRatio * 100)}%`;

          rule
            .cloneAfter({ selector: transformSelector(rule.selector) })
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
module.exports.transformSelector = transformSelector;
module.exports.getURL = getURL;
