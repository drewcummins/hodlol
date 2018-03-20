import { Exchange } from "../exchange";
import { BN, ID, API, Scenario, ScenarioMode, Order } from "../types";
import { InvalidExchangeNameError, InvalidOrderSideError, InsufficientFundsError } from "../../errors";
import { sleep, Thread, formatTimestamp } from "../../utils";
import { Strategy, TraderStrategyInterface, StrategyJSON } from "../strategy";
import { OrderRequest, OrderType, OrderSide } from "../order";
import { request } from "https";
import { Portfolio } from "../portfolio";
import { MockAPI } from "../mock-api";
import { config } from "../../config";
import * as mkdirp from "mkdirp";
const ccxt = require('ccxt');
const dateFormat = require('dateformat');
const colors = require('ansicolors');
const columnify = require('columnify');

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
  protected thread:Thread;
  protected print:boolean = true;

  /**
   * Creates a new Trader
   * 
   * @param source The trader json that describes how to initialize strategies etc.
   * @param params Parameters that describe how to interact with an exchange
   */
  constructor(protected source:TraderJSON, protected params:TraderParams) {
    if (params.backtest) {
      Scenario.create(params.backtest);
    } else { 
      Scenario.createWithName(formatTimestamp(+new Date()), +new Date(), 0);
      mkdirp.sync(`./data/${source.exchange}/${Scenario.getInstance().id}`);
    }

    let apiClass = ccxt[source.exchange];
    if (!apiClass) throw new InvalidExchangeNameError(source.exchange);
    let apiCreds = config[source.exchange];
    let api:API = new apiClass(apiCreds);
    // This is a little weird
    // Basically we use a "real" API no matter what to pull markets
    // Everything else gets faked when mocked
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
      this.print = true;
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

  protected async initExchange() {
    await this.exchange.validateFunds(this.params.symbol, this.params.amount);
    await this.exchange.loadFeeds(this.source.tickers);
    await this.exchange.loadMarketplace(this.source.tickers);
    await this.initStrategies();
  }

  /** 
   * Kicks off everything necessary for the exchange and initializes all strategies
  */
  public async run() {
    await this.initExchange();

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

      if (this.params.backtest) {
        if (this.thread.hasCycled(100)) this.printPerformance();
        Scenario.getInstance().time += 10000;
        if (Scenario.getInstance().time > Scenario.getInstance().end) {
          Thread.killAll();
          this.printPerformance();
        }
      } else {
        if (this.print) this.printPerformance();
        Scenario.getInstance().time = +new Date();
      }

      await this.thread.sleep(1);
    }

    for (const strategy of this.strategies) {
      await strategy.after();
    }
  }

  /** 
   * Kills this trader's run thread
   * 
   * This will leave "orphaned threads"
   * To kill everything call @Thread.killAll()
  */
  public kill():void {
    this.thread.kill();
  }

  /**
   * Asks the trader to "consider" an order
   * 
   * @param strategy Strategy requesting the order
   * @param orderRequest Order being requested
   * 
   * @returns the created order if successful
   */
  public async consider(strategy:Strategy, orderRequest:OrderRequest):Promise<Order> {
    // this is not a clever trader--just create an order
    return this.exchange.createOrder(orderRequest);
  }

  protected async printPerformance() {
    if (this.strategies.length == 0) return;
    let scenario = Scenario.getInstance();
    let out = "\x1Bc\n";
    var date;
    if (scenario.mode == ScenarioMode.PLAYBACK) {
      let dateStart = colors.magenta(dateFormat(scenario.start, "mmm d, h:MM:ssTT"));
      let dateEnd = colors.magenta(dateFormat(scenario.end, "mmm d, h:MM:ssTT"));
      date = colors.magenta(dateFormat(Math.min(scenario.time, scenario.end), "mmm d, h:MM:ssTT"));
      out += ` | Backtesting from ${dateStart} to ${dateEnd}\n\n`;
    }
    let columns = [];
    for (var i = 0; i < this.strategies.length; i++) {
      let strategy = this.strategies[i];
      try {
        let value = await strategy.portfolio.value("USDT", this.exchange.price.bind(this.exchange));
        if(!strategy.originalValue) strategy.originalValue = value;
        let total:string = BN(value.all.free).plus(value.all.reserved).toFixed(2);
        let originalTotal:string = BN(strategy.originalValue.all.free).plus(strategy.originalValue.all.reserved).toFixed(2);
        let valstr = colors.green("$" + total);
        let ovalstr = colors.green("$" + originalTotal);
        columns.push({strategy: colors.blue(strategy.title), value: valstr, "original value": ovalstr});
      } catch(err) {
        throw err;
      }
    }
    let table = columnify(columns, {minWidth: 20});
    table = table.split("\n").join("\n | ");
    // console.log(" | " + table);
    out += " | " + table + "\n";
    if (Scenario.getInstance().mode == ScenarioMode.PLAYBACK) {
      out += (`\n | ${date}\n`);
    }
    console.log(`\n${out}\n`);
    this.print = false;
  }
}