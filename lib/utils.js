const path = require('path');
const Promise = require('bluebird');
const stat = Promise.promisify(require('fs').lstat);
const calipers = require('calipers')('svg');
const ResolveError = require('./FileResolveError');

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
    .map(s => `${s}:before`)
    .join(',');
};

/**
 * @param {ValueParser} tree
 * @param {String} funcName
 * @returns {{node: Object, value: String}}
 */
exports.findFunctionNode = function findFunctionNode(tree, funcName) {
  const targetNode = tree.nodes.filter((node) => {
    return node.type === 'function' && node.value === funcName;
  })[0];

  const valueNode = targetNode && targetNode.nodes.filter((node) => {
    return node.type.match(/string|word/);
  })[0];

  const value = (valueNode && typeof valueNode.value === 'string') ? valueNode.value : null;
  return { node: targetNode, value };
};
