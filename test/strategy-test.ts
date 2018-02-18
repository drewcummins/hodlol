import { Strategy, StrategyJSON, TraderStrategyInterface } from '../src/models/strategy';
import { expect } from 'chai';
import 'mocha';
import { Num } from '../src/models/types';
import { IMarket, Marketplace } from '../src/models/market';
import { Portfolio } from '../src/models/portfolio';

const BTC:string = "BTC";
const amount:Num = 10;

const market:IMarket = {
  symbol:"ETH/BTC",
  base:"ETH",
  quote:"BTC",
  maker:0.01,
  taker:0.01
}

describe('Strategy tests', async () => {
  const json = {};
  json[market.symbol] = market;
  let marketplace = new Marketplace(json);
  let portfolio = new Portfolio(marketplace, BTC, amount);
  let stratJSON:StrategyJSON = {
    weight: 1,
    indicators: [{id:"macd"}]
  }
  let tsi:TraderStrategyInterface = {
    fundSymbol: BTC,
    fundAmount: amount,
    requestOrderHandler: undefined,
    feed: undefined
  };
  it('should have expected init candle values', () => {
    let strategy = new Strategy(portfolio, stratJSON, tsi);
  });
});