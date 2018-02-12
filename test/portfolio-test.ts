import { Portfolio } from '../src/models/portfolio';
import { Marketplace, IMarket, OrderRequest, OrderType, Num, Order, OrderStatus, BN } from '../src/models/types';
import { expect } from 'chai';
import 'mocha';
import { InvalidMarketSymbolError } from '../src/errors/exchange-error';

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

  let request = new OrderRequest(OrderType.LIMIT_BUY, market.symbol, 50, 0.2, portfolio.id);
  
  it('should reserve all of bitcoin to buy ethereum -- Portfolio.reserve, Portfolio.balance', () => {
    portfolio.reserve(request);
    let btcBalance = portfolio.balance(market.quote);
    expect(btcBalance).to.exist;
    expect(btcBalance.free.toNumber()).to.equal(0);
    expect(btcBalance.reserved.toNumber()).to.equal(amount);
  });

  let order:Order = { 
    side:request.side,
    id:"id",
    symbol:market.symbol,
    status:OrderStatus.CLOSED,
    cost:request.cost(),
    filled:50 };

  it('should fill the above order giving us 50 ethereum -- Portfolio.fill, Portfolio.balanceByMarket', () => {
    portfolio.fill(order);
    let [ethBalance, btcBalance] = portfolio.balanceByMarket(market.symbol);
    expect(btcBalance.free.toNumber()).to.equal(0);
    expect(btcBalance.reserved.toNumber()).to.equal(0);
    expect(ethBalance.free.toNumber()).to.equal(50);
  });

  // const nonsense = "LOL/ROFL";

  // it('should fail to get balance of an undefined symbol -- Portfolio.balance', () => {
  //   expect(portfolio.balanceByMarket(nonsense)).to.throw(new InvalidMarketSymbolError(nonsense));
  // });
})