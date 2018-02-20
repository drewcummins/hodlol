"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const exchange_1 = require("../exchange");
const exchange_error_1 = require("../../errors/exchange-error");
const utils_1 = require("../../utils");
const portfolio_1 = require("../portfolio");
const ccxt = require('ccxt');
class Trader {
    constructor(source, params) {
        this.source = source;
        this.params = params;
        let apiClass = ccxt[source.exchange];
        if (!apiClass)
            throw new exchange_error_1.InvalidExchangeNameError(source.exchange);
        let api = new apiClass();
        this.exchange = new exchange_1.Exchange(api);
    }
    async stepExchange() {
        if (this.exchange.isDirty()) {
            this.exchange.processOrderState();
            for (let strategy of this.strategies) {
                await strategy.tick();
            }
            this.exchange.clean();
        }
    }
    async initStrategies() {
        const feed = this.exchange.feed;
        const sum = this.source.strategies.reduce((mem, strategy) => mem + strategy.weight, 0);
        const tsi = {
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
                let portfolio = new portfolio_1.Portfolio(this.exchange.markets, tsi.fundSymbol, amount);
                const strat = await Promise.resolve().then(() => require(`../strategy/${stratJSON.fileName}`));
                const stratClass = strat[stratJSON.className];
                this.strategies.push(new stratClass(portfolio, stratJSON, tsi));
            }
        }
    }
    async run() {
        this.exchange.loadMarketplace();
        this.exchange.loadFeeds(this.source.tickers);
        await this.initStrategies();
        while (!this.exchange.isLoaded()) {
            await utils_1.sleep(1000);
        }
        while (true) {
            await this.stepExchange();
            await utils_1.sleep(1000);
        }
    }
    async consider(strategy, orderRequest) {
        let portfolio = strategy.portfolio;
        if (portfolio.hasSufficientFunds(orderRequest)) {
            portfolio.reserve(orderRequest);
            return this.exchange.createOrder(orderRequest);
        }
        else {
            throw new exchange_error_1.InsufficientFundsError(orderRequest);
        }
    }
}
exports.Trader = Trader;
//# sourceMappingURL=index.js.map