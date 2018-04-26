import * as fs from "fs";
import * as mkdirp from "mkdirp";
const ccxt = require('ccxt');
import { TraderJSON, TraderParams } from "./trader";
import { Scenario, API, IScenario } from "./types";
import { InvalidExchangeNameError } from "../errors";
import { Exchange } from "./exchange";
import { Thread } from "../utils";

export class Backfiller {
  constructor(readonly trader:TraderJSON, readonly params:TraderParams) {}

  async run(name:string, start:number, end:number):Promise<string> {
    const trader:TraderJSON = this.trader;
    Scenario.createWithName(name, start, end);
    const apiClass = ccxt[trader.exchange];
    if (!apiClass) throw new InvalidExchangeNameError(trader.exchange);
    mkdirp.sync(`./${Scenario.getInstance().dataDir()}/${trader.exchange}/${name}`);
    let api:API = new apiClass();
    const exchange = new Exchange(api);
    await exchange.loadFeeds(trader.tickers);
    const basis = `${this.params.symbol}/${this.params.quote}`
    if (!exchange.feed.candles.has(basis)) {
      const ticker = exchange.addCandlestick(basis);
    }
    await exchange.loadMarketplace(trader.tickers);
    const tickers = Array.from(exchange.feed.candles.values());
    const thread:Thread = new Thread();
    for (const ticker of tickers) {
      console.log(`Pulling ${ticker.symbol} from ${exchange.name()}`);
      let last = ticker.last();
      while (!last || last.timestamp < end) {
        await ticker.step();
        last = ticker.last();
        await thread.sleep(100);
      }
    }
    let scenario:IScenario = { id:name, start:start, end:end };
    const scenarioPath:string = `./scenarios/${name}.scenario`;
    fs.writeFileSync(scenarioPath, JSON.stringify(scenario));
    console.log("Wrote scenario to", scenarioPath);
    // this will have the wrong scenario mode
    // kill it so it can be reinstantiated
    Scenario.kill();
    thread.kill();
    return scenarioPath;
  }
}