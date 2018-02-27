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
        this.initialValue = tsi.fundAmount;
        this.init(source);
    }
    async before() {
        console.log(`Strategy ${this.title} before called.`);
    }
    async after() {
        console.log(`Strategy ${this.title} after called.`);
    }
    init(source) {
        const feed = this.tsi.feed;
        if (source.indicators) {
            source.indicators.forEach(async (signal) => {
                const sig = await Promise.resolve().then(() => require(`../signal/${signal.fileName}`));
                const sigClass = sig[signal.className];
                for (const [symbol, ticker] of feed.candles.entries()) {
                    let indicator = new sigClass(feed, symbol, signal);
                    this.indicators.push(indicator);
                }
            });
        }
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
                if (types_1.BN(quote.free).isGreaterThan(0)) {
                    // greedily use up funds
                    const order = await this.placeLimitBuyOrder(indicator.symbol, types_1.BN(quote.free).toNumber(), types_1.BN(last.close));
                }
            }
            else if (signal == signal_1.SignalCode.SELL) {
                let [base, quote] = this.portfolio.balanceByMarket(indicator.symbol);
                if (types_1.BN(base.free).isGreaterThan(0)) {
                    const order = await this.placeLimitSellOrder(indicator.symbol, types_1.BN(base.free).toNumber(), types_1.BN(last.close));
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
        return await this.requestOrder(order_1.OrderType.LIMIT, order_1.OrderSide.BUY, symbol, amount, close);
    }
    async placeLimitSellOrder(symbol, budget, close) {
        return await this.requestOrder(order_1.OrderType.LIMIT, order_1.OrderSide.SELL, symbol, budget, close);
    }
    async requestOrder(type, side, market, amount, price = null) {
        let request = new order_1.OrderRequest(type, side, market, amount, price, this.portfolio.id);
        try {
            let order = await this.tsi.requestOrderHandler(this, request);
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