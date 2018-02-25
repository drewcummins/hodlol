import { Exchange } from "../exchange";
import { ID, API, Scenario } from "../types";
import { InvalidExchangeNameError, InvalidOrderSideError, InsufficientFundsError } from "../../errors/exchange-error";
import { sleep, Thread } from "../../utils";
import { Strategy, TraderStrategyInterface, StrategyJSON } from "../strategy";
import { OrderRequest, OrderType, OrderSide } from "../order";
import { request } from "https";
import { Portfolio } from "../portfolio";
import { MockAPI } from "../mock-api";
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
  backtest?: string,
  mock: boolean
}

export class Trader {
  protected exchange:Exchange;
  protected strategies:Strategy[] = [];
  private thread:Thread;

  constructor(protected source:TraderJSON, protected params:TraderParams) {
    if (params.backtest) Scenario.create(params.backtest);
    let apiClass = ccxt[source.exchange];
    if (!apiClass) throw new InvalidExchangeNameError(source.exchange);
    let api:API = new apiClass();
    if (params.mock) api = new MockAPI(api);
    this.thread = new Thread();
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
        this.exchange.registerPortfolio(portfolio);
        const strat = await import(`../strategy/${stratJSON.fileName}`);
        const stratClass = strat[stratJSON.className];
        let strategy:Strategy = new stratClass(portfolio, stratJSON, tsi);
        this.strategies.push(strategy);
      }
    }
  }

  public async run() {
    await this.exchange.loadFeeds(this.source.tickers);
    await this.exchange.loadMarketplace();
    await this.initStrategies();

    if (this.params.mock) {
      let api:MockAPI = this.exchange.api as MockAPI;
      await api.loadTickers(this.exchange.feed);
      // kick off the "server" if we're mocking
      api.run();
    }
    
    this.exchange.runTickers();

    for (const strategy of this.strategies) {
      await strategy.before();
    }

    while (this.thread.isRunning()) {
      await this.stepExchange();
      if (this.params.backtest) Scenario.getInstance().time += 10000;
      await this.thread.sleep(10);
    }

    for (const strategy of this.strategies) {
      await strategy.after();
    }
  }

  public kill():void {
    this.thread.kill();
  }

  public async consider(strategy:Strategy, orderRequest:OrderRequest) {
    // just create an order!
    return this.exchange.createOrder(orderRequest);
  }

  // public async printPerformance() {
  //   if (this.strategies.length == 0) return;
  //   console.log('\x1Bc');
  //   var date = "";
  //   if (this.exchange.isBacktesting()) {
  //     let dateStart = colors.magenta(dateFormat(config.scenario.start, "mmm d, h:MM:ssTT"));
  //     let dateEnd = colors.magenta(dateFormat(config.scenario.end, "mmm d, h:MM:ssTT"));
  //     date = colors.magenta(dateFormat(Math.min(this.exchange.time, config.scenario.end), "mmm d, h:MM:ssTT"));
  //     console.log(` | Backtesting from ${dateStart} to ${dateEnd}\n`);
  //   }
  //   let columns = [];
  //   for (var i = 0; i < this.strategies.length; i++) {
  //     let strategy = this.strategies[i];
  //     try {
  //       let value = await strategy.portfolio.value("USDT");
  //       if(!strategy.originalValue) strategy.originalValue = value;
  //       let valstr = colors.green("$" + value.total.toFixed(2));
  //       let ovalstr = colors.green("$" + strategy.originalValue.total.toFixed(2));
  //       columns.push({strategy: colors.blue(strategy.title), value: valstr, "original value": ovalstr});
  //       // console.log(" |=> " + strategy.prettyTitle(), valstr + ", original value:", ovalstr);
  //     } catch(err) {
  //       throw err;
  //       console.log("Error calculating value");
  //     }
  //   }
  //   let table = columnify(columns, {minWidth: 20});
  //   table = table.split("\n").join("\n | ");
  //   console.log(" | " + table);
  //   console.log("");
  //   console.log(` | ${date}`);
  //   console.log("\n");
  // }
}