/* global describe it */
const path = require('path');
const Promise = require('bluebird');
const postcss = require('postcss');
const plugin = require('..');

const fixturesPath = path.resolve(__dirname, 'fixtures');

function test(input, expected, opts, stripWhiteSpaces) {
  const options = Object.assign({ queryParam: false }, opts || {});
  const strip = typeof stripWhiteSpaces === 'boolean' ? stripWhiteSpaces : true;

  return postcss([plugin(options)]).process(input, { from: options.from })
    .then((result) => {
      var output = result.css.replace(/\r?\n|\r/g, '');

      if (strip) {
        output = output.replace(/\s/g, '');
      }

      output.should.be.equal(expected);
      return result;
    });
}

describe('plugin', () => {
  const from = path.resolve(fixturesPath, 'styles.css');

  it('should throw if `from` option not defined', () => {
    return test('.a{}').should.be.rejectedWith(/`from` option should be defined/);
  });

  describe('ratio function', () => {
    it('should work', () => {
      return Promise.all([
        test(
          '.a{padding-bottom:ratio(twitter.svg)}',
          '.a{padding-bottom:81%}',
          { from }
        ),

        test(
          '.a{padding-bottom:qwe(twitter.svg)}',
          '.a{padding-bottom:81%}',
          { from, funcName: 'qwe' }
        )
      ]);
    });

    it('should work with other functions', () => {
      return test(
        '.a{padding-bottom:url(image) ratio(twitter.svg) url(image2)}',
        '.a{padding-bottom:url(image) 81% url(image2)}',
        { from },
        false
      );
    });

    // TODO
    it('should work with complex expressions', () => {
      // input:    .a{padding-bottom:calc(20px + ratio(twitter.svg))}
      // expected: .a{padding-bottom:calc(20px + 81%))}
    });
  });

  describe('background image', () => {
    it('should process only URLs with specific query param', () => {
      return test(
        '.a{background-image:url(twitter.svg?zzz)}',
        '.a{background-image:url(twitter.svg?zzz)}',
        { from, queryParam: 'xxx' }
      );
    });

    it('should throw if file not found', () => {
      return test('.a{background-image:url(qwe.svg)}', null, { from }).should.be.rejected;
    });

    it('should work', () => {
      return Promise.all([
        test(
          '.a{background-image:url(twitter.svg)}',
          '.a:before{background-image:url(twitter.svg);padding-bottom:81%}',
          { from }
        ),

        test(
          '.a{background-image:url(twitter.svg)}.b{background-image:url(google.svg)}',
          '.a:before{background-image:url(twitter.svg);padding-bottom:81%}.b:before{background-image:url(google.svg);padding-bottom:33%}',
          { from }
        )
      ]);
    });

    it('should work with nested rules', () => {
      return test(
        '.a{.b{.c{background-image:url(twitter.svg)}}}',
        '.a{.b{.c:before{background-image:url(twitter.svg);padding-bottom:81%}}}',
        { from }
      );
    });
  });
});
