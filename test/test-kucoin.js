var expect = require('chai').expect;
let kucoin = require('../app/client/kucoin');

describe('Kucoin init', function() {
  it('should initialize properly', function() {
    expect(kucoin.exchange).to.equal("Kucoin");
  });
});
