const path = require('path');
const Promise = require('bluebird');
const stat = Promise.promisify(require('fs').lstat);
const calipers = require('calipers')('svg');
const createUrlsHelper = require('postcss-helpers').createUrlsHelper;
const ResolveError = require('./FileResolveError');

var funcCallExpressionRegexp = /([a-z0-9-_]+)\(([^)]*)\)/ig;

/**
 * @param {String} expression
 * @param {String} [funcName]
 * @returns {Object<String, String[]>|String[]|null}
 *
 * @example
 * getFunctionCallValue('url("image.svg"), calc(100% - 20px)')
 * // => {url: ['image.svg'], calc: ['100% - 20px']}
 *
 * getFunctionCallValue('url("image.svg"), calc(100% - 20px)', 'url')
 * => ['image.svg']
 *
 * getFunctionCallValue('url("image.svg")', 'qwe')
 * => null
 */
exports.getFunctionCallValue = function getFunctionCallValue(expression, funcName) {
  var matches;
  var found = 0;
  var result;
  var valuesByFuncNames = {};
  var foundFuncName;
  var value;

  // eslint-disable-next-line no-cond-assign
  while ((matches = funcCallExpressionRegexp.exec(expression)) !== null) {
    if (matches.length === 3) {
      found += 1;
      foundFuncName = matches[1];
      value = matches[2].replace(/["']/g, ''); // unquote func value

      if (!(foundFuncName in valuesByFuncNames)) {
        valuesByFuncNames[foundFuncName] = [];
      }

      valuesByFuncNames[foundFuncName].push(value);
    }
  }

  if (found) {
    result = valuesByFuncNames;

    if (funcName) {
      result = funcName in valuesByFuncNames ? valuesByFuncNames[funcName] : null;
    }
  } else {
    result = null;
  }

  return result;
};

/**
 * @param {String} filepath
 * @param {String} context Context directory.
 * @returns {Promise<String|ResolveError>}
 */
exports.resolveFile = function resolveFile(filepath, context) {
  var resolvePath;
  const resolveAsNodeModule = filepath.startsWith('~');
  const CODES = ResolveError.CODES;

  if (resolveAsNodeModule) {
    try {
      resolvePath = require.resolve(filepath.substr(1));
    } catch (e) {
      return Promise.reject(new ResolveError(filepath, CODES.NOT_FOUND));
    }
  } else {
    resolvePath = path.resolve(context, filepath);
  }

  return stat(resolvePath)
    .then((info) => {
      return info.isFile()
        ? resolvePath
        : Promise.reject(new ResolveError(resolvePath, CODES.NOT_A_FILE));
    })
    .catch((error) => {
      if (error.code && error.code === 'ENOENT') {
        throw new ResolveError(resolvePath, CODES.NOT_FOUND);
      }
      throw error;
    });
};

/**
 * @param {String} declarationValue
 * @param {Function} [filter]
 * @returns {URI|null}
 *
 * @example
 * getURL('url(image.png)') => URI{image.png}
 */
exports.getURL = function getURL(declarationValue, filter) {
  var url = null;
  const URLs = createUrlsHelper(declarationValue).URIS;

  if (URLs.length > 0) {
    url = typeof filter === 'function' ? URLs.filter(filter)[0] : URLs[0];
  }

  return url;
};

/**
 * @param {String} imagePath
 * @returns {Promise<Number>}
 */
exports.getAspectRatio = function getAspectRatio(imagePath) {
  return calipers.measure(imagePath)
    .then((data) => {
      const dimensions = data.pages[0];
      const ratio = dimensions.height / dimensions.width;
      return Math.round(ratio * 100) / 100; // round to two decimal places
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
