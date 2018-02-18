import { Exchange } from "../exchange";
import { ID, API } from "../types";
import { InvalidExchangeNameError } from "../../errors/exchange-error";
import { sleep } from "../../utils";
const ccxt = require('ccxt');

export interface StrategyJSON {
  id:ID,
  weight:number
}

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
  constructor(protected source:TraderJSON, params:TraderParams) {
    let apiClass = ccxt[source.exchange];
    if (!apiClass) throw new InvalidExchangeNameError(source.exchange);
    let api:API = new apiClass();
    this.exchange = new Exchange(api);
  }

  public async run() {
    this.exchange.loadMarketplace();
    this.exchange.loadFeeds(this.source.tickers);
    while (!this.exchange.isLoaded()) {
      await sleep(1000);
    }
    while (true) {
      // let price = await this.exchange.price("XMR", "USDT");
      let tick = this.exchange.feed.candles.get("ETH/BTC");
      console.log(tick.last());
      await sleep(2000);
    }
  }
}