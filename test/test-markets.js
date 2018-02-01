/*var expect = require('chai').expect;
const ccxt = require('ccxt');
var nockBack = require('nock').back;
const xu = require('../app/util/exchange-util')

nockBack.fixtures = './test/fixtures/';
nockBack.setMode('record');

let kraken = new ccxt.kraken();
let binance = new ccxt.binance();
let kucoin = new ccxt.kucoin();

const base = "ETH";
const quote = "BTC";

describe('Kraken.loadMarkets()', function() {
  it('should load kraken markets', function() {

    return nockBack('kraken-markets.json')
    .then(async ({nockDone, context}) => {

      let markets = await kraken.loadMarkets();
      expect(markets).to.not.be.null;
      let marketMap = xu.buildBaseQuoteSymbolMap(markets);
      const mappedMarket = marketMap.getMarket(base, quote);
      expect(mappedMarket.base).to.equal(base);
      expect(mappedMarket.quote).to.equal(quote);
      return Promise.resolve()
      .then(nockDone);
    });

  });
});

describe('Binance.loadMarkets()', function() {
  it('should load binance markets', function() {

    return nockBack('binance-markets.json')
    .then(async ({nockDone, context}) => {

      let markets = await binance.loadMarkets();
      expect(markets).to.not.be.null;
      let marketMap = xu.buildBaseQuoteSymbolMap(markets);
      const mappedMarket = marketMap.getMarket(base, quote);
      expect(mappedMarket.base).to.equal(base);
      expect(mappedMarket.quote).to.equal(quote);
      return Promise.resolve()
      .then(nockDone);
    });

  });
});


describe('Kucoin.loadMarkets()', function() {
  it('should load kucoin markets', function() {
    this.timeout(5000);
    return nockBack('kucoin-markets.json')
    .then(async ({nockDone, context}) => {

      let markets = await kucoin.loadMarkets();
      expect(markets).to.not.be.null;
      let marketMap = xu.buildBaseQuoteSymbolMap(markets);
      const mappedMarket = marketMap.getMarket(base, quote);
      expect(mappedMarket.base).to.equal(base);
      expect(mappedMarket.quote).to.equal(quote);
      return Promise.resolve()
      .then(nockDone);
    });

  });
});
*/
