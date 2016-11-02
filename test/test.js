/* global describe it */
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const path = require('path');
const Promise = require('bluebird');
const postcss = require('postcss');
const plugin = require('../');

chai.use(chaiAsPromised);
chai.should();

const fixturesPath = path.resolve(__dirname, 'fixtures');

function run(input, expected, opts) {
  const options = opts || {};

  return postcss([plugin(options)]).process(input, { from: options.from })
    .then((result) => {
      const output = result.css
        .replace(/\r?\n|\r/g, '')
        .replace(/\s/g, '');

      output.should.be.equal(expected);
      return result;
    });
}

describe('postcss-aspect-ratio-from-background-image', () => {
  const from = path.resolve(fixturesPath, 'styles.css');

  describe('plugin', () => {
    it('should work', () => {
      Promise.all([
        run(
          '.a{background-image:url(twitter.svg?scale)}',
          '.a:after{background-image:url(twitter.svg?scale);padding-bottom:81%}',
          { from }
        ),

        run(
          '.a{background-image:url(twitter.svg?scale)}.b{background-image:url(google.svg?scale)}',
          '.a:after{background-image:url(twitter.svg?scale);padding-bottom:81%}.b:after{background-image:url(google.svg?scale);padding-bottom:33%}',
          { from }
        )
      ]);
    });
  });
});
