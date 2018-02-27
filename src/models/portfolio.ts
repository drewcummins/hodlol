const uuid = require('uuid/v4');
import { Balance, Num, BN, ID, Value } from './types';
import { Order, OrderRequest, OrderSide, OrderType } from './order';
import { Marketplace } from './market';
import { BigNumber } from "bignumber.js";
import { InsufficientFundsError, InvalidOrderSideError } from '../errors/exchange-error';
import { Tick } from './series';

export class Portfolio {
  readonly id:string;
  private balances: Map<string,Balance> = new Map<string,Balance>();

  constructor(private markets:Marketplace, readonly fundSymbol:string='BTC', readonly fundAmount:Num=10) {
    this.id = uuid();
    this.balances.set(fundSymbol, { free:fundAmount, reserved:0 });
  }

  /**
   * Gets balance for the given currency
   * 
   * @param symbol currency symbol to get balance for
   * 
   * @returns balance
   */
  public balance(symbol:string):Balance {
    this.ensureBalance(symbol);
    return this.balances.get(symbol);
  }

  /**
   * Gets balance for base and quote of given market
   * 
   * @param marketSymbol market symbol to get balance of
   * 
   * @returns base and quote balances
   * @throws InvalidMarketSymbolError if symbol doesn't exist in markets
   */
  public balanceByMarket(marketSymbol:string):Balance[] {
    let market = this.markets.getWithSymbol(marketSymbol);
    return [market.base, market.quote].map((symbol) => this.balance(symbol));
  }


  /**
   * Checks whether there are sufficient funds for the given request
   * 
   * @param request OrderRequest to verify funds for
   * 
   * @returns whethere there are sufficient funds or not
   * @throws InvalidOrderSideError if request.side not set correctly
   */
  public hasSufficientFunds(request:OrderRequest):Boolean {
    let [base,quote] = this.balanceByMarket(request.marketSymbol);
    if (request.side == OrderSide.BUY) {
      return BN(quote.free).isGreaterThanOrEqualTo(request.cost());
    } else if (request.side == OrderSide.SELL) {
      return BN(base.free).isGreaterThanOrEqualTo(request.amount);
    } else {
      throw new InvalidOrderSideError(request);
    }
  }


  /**
   * Reserves the appropriate funds necessary to make the given request.
   * 
   * This mutates the portfolio state.
   * 
   * @param request request to accommodate
   */
  public reserve(request:OrderRequest):void {
    if (!this.hasSufficientFunds(request)) {
      throw new InsufficientFundsError(request);
    }
    let market = this.markets.getWithSymbol(request.marketSymbol);
    switch (request.side) {
      case OrderSide.BUY:
        this.removeFree(market.quote, request.cost());
        this.addReserved(market.quote, request.cost());
        break;

      case OrderSide.SELL:
        this.removeFree(market.base, request.amount);
        this.addReserved(market.base, request.amount);
        break;
    
      default:
        break;
    }
  }


  /**
   * Fills the given order.
   * 
   * This mutates the portfolio state.
   * 
   * @param order Order to fill
   */
  public fill(order:Order):void {
    let market = this.markets.getWithSymbol(order.symbol as string);
    switch (order.side) {
      case OrderSide.BUY:
        this.removeReserved(market.quote, order.cost);
        this.addFree(market.base, order.filled);
        break;

      case OrderSide.SELL:
        this.removeReserved(market.base, order.filled);
        this.addFree(market.quote, order.cost);
        break;
    
      default:
        break;
    }
  }





  private addFree(symbol:string, amount:Num):void {
    let balance = this.balance(symbol);
    balance.free = BN(balance.free).plus(amount);
  }

  private addReserved(symbol:string, amount:Num):void {
    let balance = this.balance(symbol);
    balance.reserved = BN(balance.reserved).plus(amount);
  }

  private removeFree(symbol:string, amount:Num):void {
    this.addFree(symbol, -amount);
  }

  private removeReserved(symbol:string, amount:Num):void {
    this.addReserved(symbol, -amount);
  }

  private ensureBalance(symbol:string):void {
    if (!this.balances.has(symbol)) this.balances.set(symbol, {free: 0, reserved: 0});
  }

  /**
   * Gets the value of the portfolio in @quote
   * 
   * @param quote Quote symbol to get price in
   * @param price Price function (on exchange)--this is sloppy
   * 
   * @returns portfolio value
   */
  public async value(quote='USDT', price:(base:string, quote:string) => Num):Promise<Value> {
    let value:Value = { all:{free: BN(0), reserved: BN(0)} };
    let balances = this.balances.keys();
    for (let base of balances) {
      if (base == quote) {
        let balance = this.balances.get(base);
        value.all.free = BN(value.all.free).plus(balance.free);
        value.all.reserved = BN(value.all.reserved).plus(balance.reserved);
        value[base] = balance;
        continue;
      }
      let rate = await price(base, quote);
      let balance = this.balances.get(base);
      console.log(base, quote, rate, balance)
      value[base] = {free: BN(balance.free).times(rate), reserved: BN(balance.reserved).times(rate)};
      value.all.free = BN(value.all.free).plus(value[base].free);
      value.all.reserved = BN(value.all.reserved).plus(value[base].reserved);
    }
    return value;
  }
}

