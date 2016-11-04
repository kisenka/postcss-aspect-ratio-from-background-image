/* global describe it */
const path = require('path');
const assert = require('chai').assert;
const utils = require('../lib/utils');
const FileResolveError = require('../lib/FileResolveError');

const equal = assert.strictEqual;
const deepEqual = assert.deepEqual;
const fixturesPath = path.resolve(__dirname, 'fixtures');

describe('utils', () => {
  describe('getFunctionCallValue()', () => {
    it('should works!', () => {
      const getValue = utils.getFunctionCallValue;
      const testString = 'url(image), url("image2"), url(\'image3\'), calc(100% - 10px)';

      equal(getValue(''), null);
      deepEqual(getValue('url()'), { url: [''] });
      deepEqual(getValue('url("")'), { url: [''] });
      deepEqual(getValue('url(\'\')'), { url: [''] });
      deepEqual(getValue('url(), calc()'), { url: [''], calc: [''] });
      deepEqual(getValue('url(a)'), { url: ['a'] });

      deepEqual(getValue(testString), {
        url: ['image', 'image2', 'image3'],
        calc: ['100% - 10px']
      });

      deepEqual(getValue(testString, 'url'), ['image', 'image2', 'image3']);
      deepEqual(getValue(testString, 'calc'), ['100% - 10px']);
      equal(getValue(testString, 'qwe'), null);
    });
  });

  describe('resolveFile()', () => {
    const resolveFile = utils.resolveFile;
    const CODES = FileResolveError.CODES;

    it('should return a promise', () => {
      return resolveFile('google.svg', fixturesPath)
        .should.eventually.be.a('string')
        .and.be.promise;
    });

    it('should resolve files in node_modules if request starts with ~', () => {
      return resolveFile('~postcss')
        .should.be.fulfilled
        .and.eventually.be.a('string');
    });

    it('should reject if file not found in node_modules', () => {
      return resolveFile('~postcss/qwe.svg')
        .should.be.rejectedWith(FileResolveError)
        .and.eventually.have.a.property('code').which.equal(CODES.NOT_FOUND);
    });

    it('should reject with custom error if file not found', () => {
      return resolveFile('qwe', fixturesPath)
        .should.rejectedWith(FileResolveError)
        .and.eventually.have.a.property('code').which.equal(CODES.NOT_FOUND);
    });

    it('should reject if resource is a file', () => {
      return resolveFile('dir', fixturesPath)
        .should.rejectedWith(FileResolveError)
        .and.eventually.have.a.property('code').which.equal(CODES.NOT_A_FILE);
    });
  });

  describe('getURL()', () => {
    const getURL = utils.getURL;

    it('should works', () => {
      equal(getURL('url(qwe.svg)').toString(), 'qwe.svg');
      equal(getURL('url(qwe.svg?qwe)').toString(), 'qwe.svg?qwe');
      equal(getURL('url(1.svg), url(2.svg)').toString(), '1.svg');
    });
  });

  describe('getAspectRatio()', () => {
    const getAspectRatio = utils.getAspectRatio;

    it('should return a number with 2 decimal places', () => {
      return getAspectRatio(`${fixturesPath}/google.svg`)
        .should.eventually.equal(0.33)
        .and.be.promise;
    });

    it('should reject when invalid SVG', () => {
      return getAspectRatio(`${fixturesPath}/svg-without-width-height-and-viewbox.svg`)
        .should.be.rejectedWith(/invalid/i);
    });

    it('should throw when not SVG file', () => {
      return getAspectRatio(`${fixturesPath}/twitter.png`)
        .should.be.rejectedWith(/not supported/);
    });
  });

  describe('transformSelector()', () => {
    const transform = utils.transformSelector;

    it('should works', () => {
      equal(transform('.a'), '.a:after');
      equal(transform('.a, .b'), '.a:after, .b:after');
      equal(transform('.a.a, .b.b'), '.a.a:after, .b.b:after');
    });
  });
});
