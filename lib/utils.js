const calipers = require('calipers')('svg');
const createUrlsHelper = require('postcss-helpers').createUrlsHelper;

/**
 * @param imagePath
 * @returns {Promise<Number>}
 */
exports.getAspectRatio = function getAspectRatio(imagePath) {
  return calipers.measure(imagePath)
    .then((data) => {
      const dimensions = data.pages[0];
      return dimensions.height / dimensions.width;
    });
};

/**
 * @param {String} selector
 * @returns {String}
 */
exports.transformSelector = function transformSelector(selector) {
  return selector.split(',')
    .map(s => `${s}:after`)
    .join(',');
};

/**
 * @param {String} declarationValue
 * @param {Function} [filter]
 * @returns {URI|null}
 */
exports.getURL = function getURL(declarationValue, filter) {
  var url = null;
  const URLs = createUrlsHelper(declarationValue).URIS;

  if (URLs.length > 0) {
    url = typeof filter === 'function' ? URLs.filter(filter)[0] : URLs[0];
  }

  return url;
};
