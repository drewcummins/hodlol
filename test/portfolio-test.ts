import { Portfolio } from '../src/models/portfolio';
import { Num, BN } from '../src/models/types';
import { Marketplace, IMarket } from '../src/models/market';
import { Order, OrderRequest, OrderStatus, OrderType } from '../src/models/order';
import { expect } from 'chai';
import 'mocha';
import { InvalidMarketSymbolError, InsufficientFundsError } from '../src/errors/exchange-error';

const BTC:string = "BTC";
const amount:Num = 10;

const market:IMarket = {
  symbol:"ETH/BTC",
  base:"ETH",
  quote:"BTC",
  maker:0.01,
  taker:0.01
}

describe('Appropriately reflect portfolio state', () => {
  const json = {};
  json[market.symbol] = market;
  let marketplace = new Marketplace(json);
  let portfolio = new Portfolio(marketplace, BTC, amount);
  it('should have empty ethereum and 10 bitcoin -- Portfolio.balanceByMarket', () => {
    let [ethBalance, btcBalance] = portfolio.balanceByMarket(market.symbol);
    expect(ethBalance).to.exist;
    expect(btcBalance).to.exist;
    expect(ethBalance.free.toNumber()).to.equal(0);
    expect(ethBalance.reserved.toNumber()).to.equal(0);
    expect(btcBalance.free.toNumber()).to.equal(amount);
    expect(btcBalance.reserved.toNumber()).to.equal(0);
  });

  let buyRequest = new OrderRequest(OrderType.LIMIT_BUY, market.symbol, 50, 0.2, portfolio.id);
  
  it('should reserve all of bitcoin to buy ethereum -- Portfolio.reserve, Portfolio.balance', () => {
    portfolio.reserve(buyRequest);
    let btcBalance = portfolio.balance(market.quote);
    expect(btcBalance).to.exist;
    expect(btcBalance.free.toNumber()).to.equal(0);
    expect(btcBalance.reserved.toNumber()).to.equal(amount);
  });

  let buyOrder:Order = { 
    side:buyRequest.side,
    id:"buy",
    symbol:market.symbol,
    status:OrderStatus.CLOSED,
    cost:buyRequest.cost(),
    filled:50 };

  it('should fill the above order giving us 50 ethereum -- Portfolio.fill, Portfolio.balanceByMarket', () => {
    portfolio.fill(buyOrder);
    let [ethBalance, btcBalance] = portfolio.balanceByMarket(market.symbol);
    expect(btcBalance.free.toNumber()).to.equal(0);
    expect(btcBalance.reserved.toNumber()).to.equal(0);
    expect(ethBalance.free.toNumber()).to.equal(buyRequest.amount);
  });

  const nonsense = "LOL/ROFL";

  it('should fail to get balance of an undefined symbol -- Portfolio.balance', () => {
    let error = new InvalidMarketSymbolError(nonsense);
    expect(portfolio.balanceByMarket.bind(portfolio, nonsense)).to.throw(InvalidMarketSymbolError, error.message);
  });

  it('should fail to reserve for the given request since there are now insufficient funds -- Portfolio.reserve', () => {
    let error = new InsufficientFundsError(buyRequest);
    expect(portfolio.reserve.bind(portfolio, buyRequest)).to.throw(InsufficientFundsError, error.message);
  });

  let sellRequest = new OrderRequest(OrderType.LIMIT_SELL, market.symbol, 50, 0.2, portfolio.id);

  it('should reserve all the ethereum to sell -- Portfolio.reserve, Portfolio.balance', () => {
    portfolio.reserve(sellRequest);
    let ethBalance = portfolio.balance(market.base);
    expect(ethBalance).to.exist;
    expect(ethBalance.free.toNumber()).to.equal(0);
    expect(ethBalance.reserved.toNumber()).to.equal(sellRequest.amount);
  });

  let sellOrder:Order = { 
    side:sellRequest.side,
    id:"sell",
    symbol:market.symbol,
    status:OrderStatus.CLOSED,
    cost:sellRequest.cost(),
    filled:50 };

  it('should fill the sell order giving us back our original 10 bitcoin -- Portfolio.fill, Portfolio.balanceByMarket', () => {
    portfolio.fill(sellOrder);
    let [ethBalance, btcBalance] = portfolio.balanceByMarket(market.symbol);
    expect(btcBalance.free.toNumber()).to.equal(amount);
    expect(btcBalance.reserved.toNumber()).to.equal(0);
    expect(ethBalance.free.toNumber()).to.equal(0);
    expect(ethBalance.reserved.toNumber()).to.equal(0);
  });
})