const expect = require('chai').expect;

var nockBack = require('nock').back;
nockBack.fixtures = './test/fixtures/';
nockBack.setMode('record');

const config = require('../config');
config.record = false;
config.fakeOrders = true;

const xu = require('../app/util/exchange');
const Exchange = require("../app/model/base/exchange");
const Feed = require("../app/model/base/feed");

const apiName = "binance";
let binance = xu.getExchange(apiName);

let exchange = new Exchange(binance);

describe('Exchange init', () => {
  it('Exchange should have correct parameters', () => {
    expect(exchange.mode).to.equal(4); // fake
    expect(exchange.name).to.equal(apiName);
    expect(exchange.dirty).to.be.false;
  });

  it('Exchange state query methods should be as expected', () => {
    expect(exchange.isBacktesting()).to.be.false;
    expect(exchange.isRecording()).to.be.false;
    expect(exchange.isFaked()).to.be.true;
    expect(exchange.requiresMock()).to.be.true;
  });

  it('Exchange.invalidate should update time and mark itself dirty', () => {
    const timestamp = +new Date();
    exchange.invalidate(timestamp);
    expect(exchange.time).to.equal(timestamp);
    expect(exchange.dirty).to.be.true;
  });

  it('Exchange.init should load markets and create feed', () => {
    return nockBack('binance-get-market.json')
    .then(async ({nockDone, context}) => {
      await exchange.init();
      expect(exchange.feed).to.be.an.instanceof(Feed);
      expect(exchange.markets).to.exist;

      const base = 'ETH';
      const quote = 'BTC';
      const symbol = `${base}/${quote}`;

      expect(exchange.markets[symbol]).to.exist;

      await exchange.indexMarkets(exchange.markets, false);
      let market = exchange.sym(symbol);
      expect(market).to.exist;
      expect(market.base).to.equal(base);
      expect(market.quote).to.equal(quote);
      return Promise.resolve()
      .then(nockDone);
    });
  });
});

// const ccxt = require('ccxt');
// const nockBack = require('nock').back;
// const xu = require('../app/util/exchange-util')
//
// nockBack.fixtures = './test/fixtures/';
// nockBack.setMode('record');
