/* global describe it */
const path = require('path');
const assert = require('chai').assert;
const utils = require('../lib/utils');
const FileResolveError = require('../lib/FileResolveError');

const equal = assert.strictEqual;
const fixturesPath = path.resolve(__dirname, 'fixtures');

describe('utils', () => {
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
      equal(transform('.a'), '.a:before');
      equal(transform('.a, .b'), '.a:before, .b:before');
      equal(transform('.a.a, .b.b'), '.a.a:before, .b.b:before');
    });
  });
});
