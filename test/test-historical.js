var expect = require('chai').expect;
const ccxt = require('ccxt');
var nockBack = require('nock').back;
const xu = require('../app/util/exchange-util')

nockBack.fixtures = './test/fixtures/';
nockBack.setMode('record');

let binance = new ccxt.binance();
let bittrex = new ccxt.bittrex();

const base = "ETH";
const quote = "BTC";
const period = "1m";

describe('Binance.fetchOHLCV()', function() {
  it('should load open high low close volume candlesticks from binance', function() {
    this.timeout(5000);
    return nockBack('binance-historical.json')
    .then(async ({nockDone, context}) => {

      let markets = await binance.loadMarkets();
      let marketMap = xu.buildBaseQuoteSymbolMap(markets);
      const mappedMarket = marketMap.getMarket(base, quote);
      const symbol = mappedMarket.symbol;
      const ohlcv = await binance.fetchOHLCV(symbol, period);
      expect(ohlcv).to.be.a('array');
      expect(ohlcv.length).to.be.gt(0);
      const lc = ohlcv[ohlcv.length-1]; // last candlestick
      expect(lc).to.be.a('array');
      expect(lc.length).to.equal(6);
      expect(lc[0]).to.be.a('number');
      expect(lc[1]).to.be.a('number');
      expect(lc[2]).to.be.a('number');
      expect(lc[3]).to.be.a('number');
      expect(lc[4]).to.be.a('number');
      expect(lc[5]).to.be.a('number');
      return Promise.resolve()
      .then(nockDone);
    });

  });
});

describe('Bittrex.fetchOHLCV()', function() {
  it('should load open high low close volume candlesticks from bittrex', function() {
    this.timeout(5000);
    return nockBack('bittrex-historical.json')
    .then(async ({nockDone, context}) => {

      let markets = await bittrex.loadMarkets();
      let marketMap = xu.buildBaseQuoteSymbolMap(markets);
      const mappedMarket = marketMap.getMarket(base, quote);
      const symbol = mappedMarket.symbol;
      const ohlcv = await bittrex.fetchOHLCV(symbol, period);
      expect(ohlcv).to.be.a('array');
      expect(ohlcv.length).to.be.gt(0);
      const lc = ohlcv[ohlcv.length-1]; // last candlestick
      expect(lc).to.be.a('array');
      expect(lc.length).to.equal(6);
      expect(lc[0]).to.be.a('number');
      expect(lc[1]).to.be.a('number');
      expect(lc[2]).to.be.a('number');
      expect(lc[3]).to.be.a('number');
      expect(lc[4]).to.be.a('number');
      expect(lc[5]).to.be.a('number');
      return Promise.resolve()
      .then(nockDone);
    });

  });
});
