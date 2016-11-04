/* global describe it */
const path = require('path');
const Promise = require('bluebird');
const postcss = require('postcss');
const plugin = require('..');

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

describe('plugin', () => {
  const from = path.resolve(fixturesPath, 'styles.css');

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
    return run('.a{background-image:url(qwe.svg)}', null, { from }).should.be.rejected;
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

  it('should work with nested rules', () => {
    return run(
      '.a{.b{.c{background-image:url(twitter.svg)}}}',
      '.a{.b{.c:after{background-image:url(twitter.svg);padding-bottom:81%}}}',
      { from }
    );
  });
});
