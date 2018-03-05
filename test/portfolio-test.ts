import { Portfolio } from '../src/models/portfolio';
import { Num, BN, Order, OrderTick } from '../src/models/types';
import { Marketplace, IMarket } from '../src/models/market';
import { OrderRequest, OrderStatus, OrderType, OrderSide, LimitBuyOrderRequest, LimitSellOrderRequest, LimitOrderRequest } from '../src/models/order';
import { expect } from 'chai';
import 'mocha';
import { InvalidMarketSymbolError, InsufficientFundsError } from '../src/errors';

const BTC:string = "BTC";
const btcFunds:Num = 10;

const market:IMarket = {
  symbol:"ETH/BTC",
  base:"ETH",
  quote:"BTC",
  maker:0.0,
  taker:0.0
}

describe('Portfolio tests', () => {
  const json = {};
  json[market.symbol] = market;
  let marketplace = new Marketplace(json);
  let portfolio = new Portfolio(marketplace, BTC, btcFunds);
  it('should have empty ethereum and 10 bitcoin -- Portfolio.balanceByMarket', () => {
    let [ethBalance, btcBalance] = portfolio.balanceByMarket(market.symbol);
    expect(ethBalance).to.exist;
    expect(btcBalance).to.exist;
    expect(BN(ethBalance.free).toNumber()).to.equal(0);
    expect(BN(ethBalance.reserved).toNumber()).to.equal(0);
    expect(BN(btcBalance.free).toNumber()).to.equal(btcFunds);
    expect(BN(btcBalance.reserved).toNumber()).to.equal(0);
  });

  let buyRequest = new LimitBuyOrderRequest(market, 50, 0.2, portfolio.id);
  
  it('should reserve all of bitcoin to buy ethereum -- Portfolio.reserve, Portfolio.balance', () => {
    portfolio.reserve(buyRequest);
    let btcBalance = portfolio.balance(market.quote);
    expect(btcBalance).to.exist;
    expect(BN(btcBalance.free).toNumber()).to.equal(0);
    expect(BN(btcBalance.reserved).toNumber()).to.equal(btcFunds);
  });

  let buyOrderTick:OrderTick = { 
    timestamp:0,
    datetime: "N/A",
    type:buyRequest.type,
    side:buyRequest.side,
    id:"buy",
    symbol:market.symbol,
    status:OrderStatus.CLOSED,
    cost:Number(buyRequest.cost()),
    filled:Number(buyRequest.benefit()),
    price:Number(buyRequest.price),
    remaining:0,
    amount:50,
    info: {},
    fee: 0
  };
  let buyOrder:Order = new Order(buyOrderTick);

  it('should fill the above order giving us 50 ethereum -- Portfolio.fill, Portfolio.balanceByMarket', () => {
    portfolio.fill(buyOrder);
    let [ethBalance, btcBalance] = portfolio.balanceByMarket(market.symbol);
    expect(BN(btcBalance.free).toNumber()).to.equal(0);
    expect(BN(btcBalance.reserved).toNumber()).to.equal(0);
    expect(BN(ethBalance.free).toNumber()).to.equal(buyRequest.amount);
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

  let sellRequest = new LimitSellOrderRequest(market, 50, 0.2, portfolio.id);

  it('should reserve all the ethereum to sell -- Portfolio.reserve, Portfolio.balance', () => {
    portfolio.reserve(sellRequest);
    let ethBalance = portfolio.balance(market.base);
    expect(ethBalance).to.exist;
    expect(BN(ethBalance.free).toNumber()).to.equal(0);
    expect(BN(ethBalance.reserved).toNumber()).to.equal(sellRequest.amount);
  });

  let sellOrderTick:OrderTick = { 
    timestamp: 0,
    datetime: "N/A",
    fee: 0,
    type:sellRequest.type,
    side:sellRequest.side,
    id:"sell",
    symbol:market.symbol,
    status:OrderStatus.CLOSED,
    cost:Number(sellRequest.benefit()),
    filled:Number(sellRequest.amount),
    remaining:0,
    info: {},
    price:Number(sellRequest.price),
    amount:Number(sellRequest.amount) 
  };

  let sellOrder:Order = new Order(sellOrderTick);

  it('should fill the sell order giving us back our original 10 bitcoin -- Portfolio.fill, Portfolio.balanceByMarket', () => {
    portfolio.fill(sellOrder);
    let [ethBalance, btcBalance] = portfolio.balanceByMarket(market.symbol);
    expect(BN(btcBalance.free).toNumber()).to.equal(btcFunds);
    expect(BN(btcBalance.reserved).toNumber()).to.equal(0);
    expect(BN(ethBalance.free).toNumber()).to.equal(0);
    expect(BN(ethBalance.reserved).toNumber()).to.equal(0);
  });

  it('should reserve and undo correctly', () => {
    portfolio.reserve(buyRequest);
    let [ethBalance, btcBalance] = portfolio.balanceByMarket(market.symbol);
    expect(BN(btcBalance.free).toNumber()).to.equal(0);
    expect(BN(btcBalance.reserved).toNumber()).to.equal(btcFunds);
    portfolio.undo(buyRequest);
    expect(BN(btcBalance.free).toNumber()).to.equal(btcFunds);
    expect(BN(btcBalance.reserved).toNumber()).to.equal(0);
  });

  // it('should calculate with fees accordingly', () => {
  //   let market:IMarket = {
  //     symbol:"ETH/BTC",
  //     base:"ETH",
  //     quote:"BTC",
  //     maker:0.01,
  //     taker:0.01
  //   };
  //   let request:LimitOrderRequest = LimitOrderRequest.buyMaxWithBudget(market, btcFunds, 0.2, "lol");
  //   expect(BN(request.amount).toNumber()).to.be.greaterThan(49);
  //   expect(BN(request.amount).toNumber()).to.be.lessThan(50);
  //   expect(BN(request.cost()).minus(BN(btcFunds)).abs().isLessThan(0.00001)).to.be.true;
  // })
})