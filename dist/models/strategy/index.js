"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const indicator_1 = require("../indicator");
const types_1 = require("../types");
const order_1 = require("../order");
const errors_1 = require("../../errors");
const utils_1 = require("../../utils");
const trade_logger_1 = require("../../utils/trade-logger");
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
                const sig = await utils_1.load(signal.fileName, "models/indicator", "../models/indicator");
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
            if (signal == indicator_1.Signal.PASS)
                continue;
            let ticker = feed.candles.get(indicator.symbol);
            // If we get a ticker that's being tracked for non-trading reasons
            if (!ticker.isTradeable)
                continue;
            let last = ticker.last();
            let market = this.portfolio.marketBySymbol(indicator.symbol);
            if (signal == indicator_1.Signal.BUY) {
                let [, quote] = this.portfolio.balanceByMarket(indicator.symbol);
                trade_logger_1.TradeLogger.logTradeEvent("Advice buy", indicator.symbol, "@", last);
                if (types_1.BN(quote.free).isGreaterThan(0)) {
                    // greedily use up funds
                    trade_logger_1.TradeLogger.logTradeEvent("Place buy order:", indicator.symbol, types_1.BN(quote.free), types_1.BN(last.close));
                    const order = await this.placeLimitBuyOrder(market, types_1.BN(quote.free), types_1.BN(last.close));
                    trade_logger_1.TradeLogger.logTradeEvent("Buy order placed:", order.state);
                }
                else {
                    trade_logger_1.TradeLogger.logTradeEvent("Unable to buy", indicator.symbol, "free:", types_1.BN(quote.free));
                }
            }
            else if (signal == indicator_1.Signal.SELL) {
                let [base,] = this.portfolio.balanceByMarket(indicator.symbol);
                trade_logger_1.TradeLogger.logTradeEvent("Advice sell", indicator.symbol, "@", last);
                if (types_1.BN(base.free).isGreaterThan(0)) {
                    trade_logger_1.TradeLogger.logTradeEvent("Place sell order", indicator.symbol, "free:", types_1.BN(base.free), "last:", types_1.BN(last.close));
                    const order = await this.placeLimitSellOrder(market, types_1.BN(base.free), types_1.BN(last.close));
                    trade_logger_1.TradeLogger.logTradeEvent("Sell order placed", order.state);
                }
                else {
                    trade_logger_1.TradeLogger.logTradeEvent("Unable to sell", indicator.symbol, "free:", types_1.BN(base.free));
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
        return this.placeOrder(order_1.LimitOrderRequest.buyMaxWithBudget(market, budget, close, this.portfolio.id));
    }
    async placeLimitSellOrder(market, budget, close) {
        return this.placeOrder(new order_1.LimitSellOrderRequest(market, budget, close, this.portfolio.id));
    }
    getTitle() {
        return "Strategy";
    }
}
exports.Strategy = Strategy;
//# sourceMappingURL=index.js.map