"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const mkdirp = require("mkdirp");
const ccxt = require('ccxt');
const types_1 = require("./types");
const errors_1 = require("../errors");
const exchange_1 = require("./exchange");
const utils_1 = require("../utils");
class Backfiller {
    constructor(trader) {
        this.trader = trader;
    }
    async run(name, start, end) {
        const trader = this.trader;
        types_1.Scenario.createWithName(name, start, end);
        const apiClass = ccxt[trader.exchange];
        if (!apiClass)
            throw new errors_1.InvalidExchangeNameError(trader.exchange);
        mkdirp.sync(`./${types_1.Scenario.getInstance().dataDir()}/${trader.exchange}/${name}`);
        let api = new apiClass();
        const exchange = new exchange_1.Exchange(api);
        await exchange.loadFeeds(trader.tickers);
        await exchange.loadMarketplace(trader.tickers);
        const tickers = Array.from(exchange.feed.candles.values());
        const thread = new utils_1.Thread();
        for (const ticker of tickers) {
            console.log(`Pulling ${ticker.symbol} from ${exchange.name()}`);
            let last = ticker.last();
            while (!last || last.timestamp < end) {
                await ticker.step();
                last = ticker.last();
                await thread.sleep(100);
            }
        }
        let scenario = { id: name, start: start, end: end };
        const scenarioPath = `./scenarios/${name}.scenario`;
        fs.writeFileSync(scenarioPath, JSON.stringify(scenario));
        console.log("Wrote scenario to", scenarioPath);
        // this will have the wrong scenario mode
        // kill it so it can be reinstantiated
        types_1.Scenario.kill();
        thread.kill();
        return scenarioPath;
    }
}
exports.Backfiller = Backfiller;
//# sourceMappingURL=backfiller.js.map