import { Strategy, StrategyJSON, TraderStrategyInterface } from '../src/models/strategy';
const ccxt = require('ccxt');
import { Num } from '../src/models/types';
import { IMarket, Marketplace } from '../src/models/market';
import { Portfolio } from '../src/models/portfolio';
import { Exchange } from '../src/models/exchange';
import { OrderRequest, OrderSide, OrderStatus } from '../src/models/order';

import { expect } from 'chai';
import 'mocha';

const BTC:string = "BTC";
const amount:Num = 10;

let api = new ccxt.binance();
let exchange:Exchange = new Exchange(api);

describe('Strategy tests', async () => {
  
  before(async () => {
    await exchange.loadMarketplace();
    await exchange.loadFeeds(["XMR/BTC", "BTC/USDT"]);
  })

  after(() => {
    console.log("ok after pls")
    exchange.killFeeds();
  })

  it('should', async () => {
    console.log(exchange.markets)
    expect("rofl".length).to.equal(4)
  })

  // console.log("b")

  // let portfolio = new Portfolio(exchange.markets, BTC, amount);
  
  // let stratJSON:StrategyJSON = {
  //   weight: 1,
  //   indicators: [{fileName:"macd", className:"MACD"}]
  // }
  
  // let tsi:TraderStrategyInterface = {
  //   fundSymbol: BTC,
  //   fundAmount: amount,
  //   requestOrderHandler: (request:OrderRequest) => {
  //     return {side:OrderSide.BUY, id:"blah", symbol:request.marketSymbol, status:OrderStatus.OPEN, cost:request.cost(), filled:0};
  //   },
  //   feed: exchange.feed
  // };

  // console.log("c")

  // it('should have expected init candle values', () => {
  //   console.log("d")
  //   let strategy = new Strategy(portfolio, stratJSON, tsi);
  //   console.log("ok.......")
  //   expect(true).to.be.true
  // });
});