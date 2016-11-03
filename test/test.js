/* global describe it */
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const path = require('path');
const Promise = require('bluebird');
const postcss = require('postcss');
const plugin = require('../');
const getURL = require('../').getURL;
const transformSelector = require('../').transformSelector;

chai.use(chaiAsPromised);
chai.should();

const fixturesPath = path.resolve(__dirname, 'fixtures');

function run(input, expected, opts) {
  const options = Object.assign({ queryParam: false }, opts || {});

  return postcss([plugin(options)]).process(input, { from: options.from })
    .then((result) => {
      const output = result.css
        .replace(/\r?\n|\r/g, '')
        .replace(/\s/g, '');

      output.should.be.equal(expected);
      return result;
    });
}

function testGetURL(input, expected) {
  getURL(input).toString().should.be.equal(expected);
}

describe('postcss-aspect-ratio-from-background-image', () => {
  const from = path.resolve(fixturesPath, 'styles.css');

  describe('getURL()', () => {
    it('should work', () => {
      testGetURL('url(qwe.svg)', 'qwe.svg');
      testGetURL('url(qwe.svg?qwe)', 'qwe.svg?qwe');
      testGetURL('url(1.svg), url(2.svg)', '1.svg');
    });
  });

  describe('transformSelector()', () => {
    it('should work', () => {
      transformSelector('.a').should.be.equal('.a:after');
      transformSelector('.a, .b').should.be.equal('.a:after, .b:after');
      transformSelector('.a.a, .b.b').should.be.equal('.a.a:after, .b.b:after');
    });
  });

  describe('plugin', () => {
    it('should throw if `from` option not defined', () => {
      return run('.a{}').should.be.rejectedWith(/`from` option should be defined/);
    });

    it('should process only URLs with specific query param', () => {
      return run(
        '.a{background-image:url(twitter.svg?zzz)}',
        '.a{background-image:url(twitter.svg?zzz)}',
        { from, queryParam: 'xxx' }
      );
    });

    it('should throw if file not found', () => {
      return run('.a{background-image:url(qwe.svg)}', null, { from })
        .should.be.rejectedWith(/not found/);
    });

    it('should throw if path not a file', () => {
      return run('.a{background-image:url(dir)}', null, { from })
        .should.be.rejectedWith(/EISDIR/);
    });

    it('should throw when invalid SVG', () => {
      return run('.a{background-image:url(svg-without-width-height-and-viewbox.svg)}', null, { from })
        .should.be.rejectedWith(/invalid/i);
    });

    it('should throw when not SVG file', () => {
      return run('.a{background-image:url(twitter.png)}', null, { from })
        .should.be.rejectedWith(/not supported/);
    });

    it('should work', () => {
      return Promise.all([
        run(
          '.a{background-image:url(twitter.svg)}',
          '.a:after{background-image:url(twitter.svg);padding-bottom:81%}',
          { from }
        ),

        run(
          '.a{background-image:url(twitter.svg)}.b{background-image:url(google.svg)}',
          '.a:after{background-image:url(twitter.svg);padding-bottom:81%}.b:after{background-image:url(google.svg);padding-bottom:33%}',
          { from }
        )
      ]);
    });

    it('should works with nested rules', () => {
      return run(
        '.a{.b{.c{background-image:url(twitter.svg)}}}',
        '.a{.b{.c:after{background-image:url(twitter.svg);padding-bottom:81%}}}',
        { from }
      );
    });
  });
});
