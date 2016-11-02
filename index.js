const path = require('path');
const fs = require('fs');
const Promise = require('bluebird');
const stat = Promise.promisify(fs.lstat);
const postcss = require('postcss');
const createUrlsHelper = require('postcss-helpers').createUrlsHelper;
const calipers = require('calipers')('svg');

// const NOENTITY_CODE =

function newSelector(selector) {
  return selector.split(',')
    .map(s => `${s}:after`)
    .join(',');
}

function getURL(value) {
  const URLs = createUrlsHelper(value).URIS;
  return URLs.length > 0 ? URLs[0] : null;
}

function getAspectRatio(filepath) {
  const contents = fs.readFileSync(filepath, 'utf-8').toString();
  const matches = contents.match(/viewBox="([^"]*)"/);
  const viewBox = matches[1] ? matches[1].split(' ').map(parseFloat) : null;
  return viewBox ? viewBox[3] / viewBox[2] : 1;
}

module.exports = postcss.plugin('postcss-aspect-ratio-from-background-image', (opts) => {
  const options = opts || {};
  const queryParam = options.queryParam || 'scale';
  const dropIfEmpty = typeof options.dropIfEmpty === 'boolean' ? options.dropIfEmpty : true;
  var skipNext = false;

  return function plugin(root) {
    const from = root.source.input.file;
    var promises = [];

    root.walkDecls(/^background(-image)?$/, (decl) => {
      var p = new Promise((resolve, reject) => {
        if (skipNext) {
          return resolve();
        }
        skipNext = false;

        const rule = decl.parent;
        const url = getURL(decl.value);
        if (!url || !url.hasQuery(queryParam)) {
          return resolve();
        }

        const imagePath = path.resolve(path.dirname(from), url.path());

        stat(imagePath)
          .then(stats => {
            if (!stats.isFile()) {
              return Promise.reject();
            }
          })
          .then(() => calipers.measure(imagePath))
          .then((data) => {
            const dimensions = data.pages[0];
            const aspectRatio = dimensions.height / dimensions.width;
            const aspectRatioString = `${Math.round(aspectRatio * 100)}%`;

            rule
              .cloneAfter({ selector: newSelector(rule.selector) })
              .removeAll()
              .append(
                { prop: decl.prop, value: decl.value },
                { prop: 'padding-bottom', value: aspectRatioString }
              );

            decl.remove();

            if (rule.nodes.length === 0 && dropIfEmpty) {
              rule.remove();
            }

            skipNext = true;
            resolve();
          })
          .catch(e => {
            return (e.code && e.code === 'ENOENT')
              ? resolve()
              : Promise.reject(e);
        })
      });

      promises.push(p);
    });

    return Promise.all(promises);
  };
});
