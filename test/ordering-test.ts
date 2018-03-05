import { Strategy, StrategyJSON } from '../src/models/strategy';
const ccxt = require('ccxt');
import { Num, Scenario, Order, TickerTick, Ticker, BN } from '../src/models/types';
import { IMarket, Marketplace } from '../src/models/market';
import { Portfolio } from '../src/models/portfolio';
import { Exchange } from '../src/models/exchange';
import { MockAPI } from '../src/models/mock-api';
import { config } from '../src/config';
import { OrderRequest, OrderSide, OrderStatus, LimitBuyOrderRequest, LimitOrderRequest } from '../src/models/order';

import { expect } from 'chai';
import 'mocha';
import { Thread, sleep } from '../src/utils';

const BTC:string = "BTC";
const amount:Num = 0.05;
const PAIR:string = `ETH/${BTC}`;

let api = new ccxt.binance(config.binance);
let exchange:Exchange = new Exchange(api);
let portfolio:Portfolio = null;

describe('Ordering tests', async () => {

  before(async () => {
    Scenario.createWithName("lol", 0, 0, false); // don't record here
  })

  after(async () => {
    Thread.killAll();
    await sleep(1200);
    Scenario.kill();
  })

  it('exchange should be ready to go', async () => {
    await exchange.validateFunds(BTC, amount);
    await exchange.loadFeeds(["ETH/BTC", "BTC/USDT"]);
    await exchange.loadMarketplace(["ETH/BTC", "BTC/USDT"]);
    portfolio = new Portfolio(exchange.markets, BTC, 0.05);
    exchange.registerPortfolio(portfolio);
    // await exchange.runTickers();
    // expect(exchange.isLoaded()).to.be.true;
  }).timeout(10000);

  it('should create a valid order', async() => {
    let tick:Ticker = await exchange.fetchTicker(PAIR);
    expect(tick).to.exist;
    expect(tick.state.symbol).to.equal(PAIR);
    // choose a ridiculously low price so that the order doesn't get filled
     
    let price:Num = BN(tick.state.close).dividedBy(10);
      // console.log("close:", tick.state.close);
      // console.log("price:", BN(price).toFixed(6));
      // let market = exchange.markets.getWithSymbol(PAIR);
      // let coeff = OrderRequest.feeCoefficient(OrderSide.BUY, market.taker);
      // console.log("coeff:", coeff.toFixed(6));
      // console.log("price x 10:", BN(price).multipliedBy(BN(10)).toFixed(6));
      // let feedPrice = price.times(coeff);
      // console.log("price x coeff:", feedPrice.toFixed(6));
      // let amt = BN(amount).div(feedPrice);
      // console.log("amt can buy:", amt.toFixed(6));
      // let cost = amt.times(feedPrice);
      // console.log("cost", cost.toFixed(6));
      // console.log("should equal", amount);
    
    let request = LimitOrderRequest.buyMaxWithBudget(exchange.markets.getWithSymbol(PAIR), amount, price, portfolio.id);
    
    // let cost:BigNumber = BN(request.cost());
    // let amt:BigNumber = BN(amount).dividedBy(BN(request.amount));
    // console.log("cost should equal amount", cost.decimalPlaces(6), amt.decimalPlaces(6), price.decimalPlaces(6));
    let order:Order = await exchange.createOrder(request);
    console.log(order);
  }).timeout(10000);

});