"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const signal_1 = require("../signal");
const types_1 = require("../types");
const order_1 = require("../order");
const exchange_error_1 = require("../../errors/exchange-error");
const uuid = require('uuid/v4');
class Strategy {
    constructor(portfolio, source, tsi) {
        this.portfolio = portfolio;
        this.tsi = tsi;
        this.indicators = [];
        this.orders = new Map();
        this.id = uuid();
        this.title = source.title || "Strategy";
        this.init(source);
    }
    init(source) {
        const feed = this.tsi.feed;
        source.indicators.forEach(async (signal) => {
            const sig = await Promise.resolve().then(() => require(`../signal/${signal.fileName}`));
            const sigClass = sig[signal.className];
            for (const [symbol, ticker] of feed.candles.entries()) {
                let indicator = new sigClass(feed, symbol, signal);
                this.indicators.push(indicator);
            }
        });
    }
    async tick() {
        const feed = this.tsi.feed;
        for (let indicator of this.indicators) {
            let signal = await indicator.tick();
            if (signal == signal_1.SignalCode.PASS)
                continue;
            let ticker = feed.candles.get(indicator.symbol);
            let last = ticker.last();
            if (signal == signal_1.SignalCode.BUY) {
                let [base, quote] = this.portfolio.balanceByMarket(indicator.symbol);
                if (quote.free.isGreaterThan(0)) {
                    // greedily use up funds
                    const order = await this.placeLimitBuyOrder(indicator.symbol, quote.free.toNumber(), Number(last.close));
                }
            }
            else if (signal == signal_1.SignalCode.SELL) {
                let [base, quote] = this.portfolio.balanceByMarket(indicator.symbol);
                if (base.free.isGreaterThan(0)) {
                    const order = await this.placeLimitSellOrder(indicator.symbol, base.free.toNumber(), Number(last.close));
                }
            }
            else {
                throw new exchange_error_1.InvalidSignalError(indicator, signal);
            }
        }
        ;
    }
    async placeLimitBuyOrder(symbol, budget, close) {
        let amount = types_1.BN(budget).dividedBy(types_1.BN(close));
        return await this.requestOrder(order_1.OrderType.LIMIT_BUY, symbol, amount, close);
    }
    async placeLimitSellOrder(symbol, budget, close) {
        return await this.requestOrder(order_1.OrderType.LIMIT_SELL, symbol, budget, close);
    }
    async requestOrder(type, market, amount, price = null) {
        let request = new order_1.OrderRequest(type, market, amount, price, this.portfolio.id);
        try {
            let order = await this.tsi.requestOrderHandler(request);
            this.orders.set(order.id, order);
            return order;
        }
        catch (err) {
            console.log("Error on request order:", request, err.message);
            return null; // figure out how we want to handle this generic error case
        }
    }
}
exports.Strategy = Strategy;
//# sourceMappingURL=index.js.map