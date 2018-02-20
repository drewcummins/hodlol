import { Exchange } from "../exchange";
import { ID, API } from "../types";
import { InvalidExchangeNameError, InvalidOrderSideError, InsufficientFundsError } from "../../errors/exchange-error";
import { sleep } from "../../utils";
import { Strategy, TraderStrategyInterface, StrategyJSON } from "../strategy";
import { OrderRequest, OrderType, OrderSide } from "../order";
import { request } from "https";
import { Portfolio } from "../portfolio";
const ccxt = require('ccxt');

export interface TraderJSON {
  name:string,
  exchange:string,
  strategies:StrategyJSON[],
  tickers:string[]
}

export interface TraderParams {
  symbol: string,
  amount: number,
  backtest: string,
  fake: boolean
}

export class Trader {
  protected exchange:Exchange;
  protected strategies:Strategy[] = [];

  constructor(protected source:TraderJSON, protected params:TraderParams) {
    let apiClass = ccxt[source.exchange];
    if (!apiClass) throw new InvalidExchangeNameError(source.exchange);
    let api:API = new apiClass();
    this.exchange = new Exchange(api);
  }

  protected async stepExchange() {
    if (this.exchange.isDirty()) {
      this.exchange.processOrderState();
      for (let strategy of this.strategies) {
        await strategy.tick();
      }
      this.exchange.clean();
    }
  }

  protected async initStrategies() {
    const feed = this.exchange.feed;
    const sum = this.source.strategies.reduce((mem, strategy) => mem + strategy.weight, 0);
    const tsi:TraderStrategyInterface = {
      fundSymbol: this.params.symbol,
      fundAmount: this.params.amount,
      feed: this.exchange.feed,
      requestOrderHandler: this.consider.bind(this)
    };
    for (let stratJSON of this.source.strategies) {
      // this normalizes the weights in all provided strategies and
      // divvies up the trader's total funds accordingly
      const amount = tsi.fundAmount * stratJSON.weight / sum;
      if (amount > 0) {
        let portfolio = new Portfolio(this.exchange.markets, tsi.fundSymbol, amount);
        const strat = await import(`../strategy/${stratJSON.fileName}`);
        const stratClass = strat[stratJSON.className];
        this.strategies.push(new stratClass(portfolio, stratJSON, tsi));
      }
    }
  }

  public async run() {
    await this.exchange.loadMarketplace();
    await this.exchange.loadFeeds(this.source.tickers);
    await this.initStrategies();
    while (this.exchange.isLoaded()) {
      await this.stepExchange();
      await sleep(10);
    }
  }

  public kill():void {
    this.exchange.killFeeds();
  }

  public async consider(strategy:Strategy, orderRequest:OrderRequest) {
    let portfolio = strategy.portfolio;
    if (portfolio.hasSufficientFunds(orderRequest)) {
      portfolio.reserve(orderRequest);
      return;
      // return this.exchange.createOrder(orderRequest);
    } else {
      throw new InsufficientFundsError(orderRequest);
    }
  }
}