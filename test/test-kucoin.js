var expect = require('chai').expect;
let kucoin = require('../app/client/kucoin');
var nockBack = require('nock').back;

nockBack.fixtures = './test/fixtures/';
nockBack.setMode('record');

describe('Kucoin init', function() {
  it('should initialize properly', function() {
    expect(kucoin.exchange).to.equal("Kucoin");
  });
});

describe('Kucoin.getTicker()', function() {
  it('should get ticker value', function() {

    return nockBack('kucoin-ticker.json')
    .then(async ({nockDone, context}) => {
      const coin = "VEN";
      const market = "BTC"
      const pair = `${coin}-${market}`;
      const res = await kucoin.getTicker(pair);
      expect(res.statusCode).to.equal(200);
      expect(res.success).to.be.true;
      expect(res.data.symbol).to.equal(pair);
      expect(res.data.coinType).to.equal(coin);
      expect(res.data.coinTypePair).to.equal(market);
      expect(res.data.trading).to.be.true;
      expect(res.data.lastDealPrice).to.be.a('number');
      expect(res.data.buy).to.be.a('number');
      expect(res.data.sell).to.be.a('number');
      expect(res.data.change).to.be.a('number');
      expect(res.data.feeRate).to.be.a('number');
      expect(res.data.volValue).to.be.a('number');
      expect(res.data.high).to.be.a('number');
      expect(res.data.vol).to.be.a('number');
      expect(res.data.low).to.be.a('number');
      expect(res.data.changeRate).to.be.a('number');
      return Promise.resolve()
      .then(nockDone);
    });

  });
});

describe('Kucoin.getBalance()', function() {
  it('should get coin balance', function() {

    return nockBack('kucoin-balance.json')
    .then(async ({nockDone, context}) => {
      const coin = "VEN";
      const res = await kucoin.getBalance(coin);
      expect(res.statusCode).to.equal(200);
      expect(res.success).to.be.true;
      expect(res.data.coinType).to.equal(coin);
      expect(res.data.balance).to.be.a('number');
      expect(res.data.freezeBalance).to.be.a('number');
      return Promise.resolve()
      .then(nockDone);
    });

  });
});
