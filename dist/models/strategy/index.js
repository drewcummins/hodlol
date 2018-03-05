"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const signal_1 = require("../signal");
const types_1 = require("../types");
const order_1 = require("../order");
const errors_1 = require("../../errors");
const uuid = require('uuid/v4');
class Strategy {
    constructor(portfolio, source, tsi) {
        this.portfolio = portfolio;
        this.tsi = tsi;
        this.indicators = [];
        this.orders = new Map();
        this.id = uuid();
        this.title = source.title || this.getTitle();
        this.initialValue = tsi.fundAmount;
        this.init(source);
    }
    async before() {
        //
    }
    async after() {
        //
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
            let market = this.portfolio.marketBySymbol(indicator.symbol);
            if (signal == signal_1.SignalCode.BUY) {
                let [base, quote] = this.portfolio.balanceByMarket(indicator.symbol);
                if (types_1.BN(quote.free).isGreaterThan(0)) {
                    // greedily use up funds
                    const order = await this.placeLimitBuyOrder(market, types_1.BN(quote.free), types_1.BN(last.close));
                }
            }
            else if (signal == signal_1.SignalCode.SELL) {
                let [base, quote] = this.portfolio.balanceByMarket(indicator.symbol);
                if (types_1.BN(base.free).isGreaterThan(0)) {
                    const order = await this.placeLimitSellOrder(market, types_1.BN(base.free), types_1.BN(last.close));
                }
            }
            else {
                throw new errors_1.InvalidSignalError(indicator, signal);
            }
        }
        ;
    }
    async placeOrder(request) {
        try {
            let order = await this.tsi.requestOrderHandler(this, request);
            this.orders.set(order.state.id, order);
            return order;
        }
        catch (err) {
            // default to doing nothing; strategy subclasses can handle this differently
            return null;
        }
    }
    async placeLimitBuyOrder(market, budget, close) {
        let max = order_1.LimitOrderRequest.buyMaxWithBudget(market, budget, close, this.portfolio.id);
        let order = new order_1.MarketBuyOrderRequest(market, max.amount, close, this.portfolio.id);
        return this.placeOrder(order);
        // return this.placeOrder(LimitOrderRequest.buyMaxWithBudget(market, budget, close, this.portfolio.id));
    }
    async placeLimitSellOrder(market, budget, close) {
        return this.placeOrder(new order_1.MarketSellOrderRequest(market, budget, close, this.portfolio.id));
        // return this.placeOrder(new LimitSellOrderRequest(market, budget, close, this.portfolio.id));
    }
    getTitle() {
        return "Strategy";
    }
}
exports.Strategy = Strategy;
//# sourceMappingURL=index.js.map