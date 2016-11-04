/* global describe it */
const utils = require('../lib/utils');

const transformSelector = utils.transformSelector;

function testGetURL(input, expected) {
  utils.getURL(input).toString().should.be.equal(expected);
}

describe('utils', () => {
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
});
