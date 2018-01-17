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
      console.log(ohlcv);
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
      console.log(ohlcv);
      return Promise.resolve()
      .then(nockDone);
    });

  });
});
