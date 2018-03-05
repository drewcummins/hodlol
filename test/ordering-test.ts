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
    let price = BN(tick.state.close).dividedBy(10);
    
    let request = LimitOrderRequest.buyMaxWithBudget(exchange.markets.getWithSymbol(PAIR), amount, price, portfolio.id);
    let market = exchange.markets.getWithSymbol(PAIR);
    let coeff = OrderRequest.feeCoefficient(OrderSide.BUY, market.taker);

    expect(BN(amount).isGreaterThanOrEqualTo(request.cost())).to.be.true;
    expect(BN(amount).minus(request.cost()).isLessThan(0.001)).to.be.true;
    
    let order:Order = await exchange.createOrder(request);

    expect(order.state.symbol).to.equal(PAIR);
    expect(BN(order.state.price).isEqualTo(request.price));
    expect(order.state.status).to.equal(OrderStatus.OPEN);

    await exchange.cancelOrder(order.state.id, order.state.symbol);
    order = await exchange.fetchOrder(order.state.id, order.state.symbol);

    expect(order.state.symbol).to.equal(PAIR);
    expect(BN(order.state.price).isEqualTo(request.price));
    expect(order.state.status).to.equal(OrderStatus.CANCELED);
    
  }).timeout(10000);

});