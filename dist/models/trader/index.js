"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const exchange_1 = require("../exchange");
const exchange_error_1 = require("../../errors/exchange-error");
const utils_1 = require("../../utils");
const ccxt = require('ccxt');
class Trader {
    constructor(source, params) {
        this.source = source;
        let apiClass = ccxt[source.exchange];
        if (!apiClass)
            throw new exchange_error_1.InvalidExchangeNameError(source.exchange);
        let api = new apiClass();
        this.exchange = new exchange_1.Exchange(api);
    }
    async run() {
        this.exchange.loadMarketplace();
        this.exchange.loadFeeds(this.source.tickers);
        while (!this.exchange.isLoaded()) {
            await utils_1.sleep(1000);
        }
        while (true) {
            // let price = await this.exchange.price("XMR", "USDT");
            let tick = this.exchange.feed.candles.get("ETH/BTC");
            console.log(tick.last());
            await utils_1.sleep(2000);
        }
    }
}
exports.Trader = Trader;
//# sourceMappingURL=index.js.map