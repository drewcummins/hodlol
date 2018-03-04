"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const errors_1 = require("../errors");
class Marketplace {
    constructor(markets) {
        this.symbolMap = {};
        this.baseMap = {};
        this.quoteMap = {};
        for (const marketSymbol in markets) {
            const market = markets[marketSymbol];
            this.symbolMap[market.symbol] = market;
            this.baseMap[market.base] = this.baseMap[market.base] || {};
            this.baseMap[market.base][market.quote] = market;
            this.quoteMap[market.quote] = this.quoteMap[market.quote] || {};
            this.quoteMap[market.quote][market.base] = market;
        }
    }
    /**
     * Gets market for the given symbol
     *
     * @param symbol Market symbol to grab
     *
     * @returns market with given symbol
     */
    getWithSymbol(symbol) {
        return this.getMarket(this.symbolMap, symbol);
    }
    /**
     * Gets market by base and quote symbols
     *
     * @param base Base symbol of pair
     * @param quote Quote symbol of pair
     *
     * @returns appropriate market
     */
    getWithBase(base, quote) {
        let markets = this.getMarketsWithBase(base);
        return this.getMarket(markets, quote);
    }
    /**
     * Gets markets by base
     *
     * @param base Base symbol of pair
     *
     * @returns matching markets
     */
    getMarketsWithBase(base) {
        return this.getMarketMap(this.baseMap, base);
    }
    /**
     * Gets market by base and quote symbols
     *
     * @param quote Quote symbol of pair
     * @param base Base symbol of pair
     *
     * @returns appropriate market
     */
    getWithQuote(quote, base) {
        let markets = this.getMarketsWithQuote(quote);
        return this.getMarket(markets, base);
    }
    /**
     * Gets markets by quote
     *
     * @param quote Quote symbol of pair
     *
     * @returns matching markets
     */
    getMarketsWithQuote(quote) {
        return this.getMarketMap(this.quoteMap, quote);
    }
    getMarket(map, symbol) {
        let market = this.symbolMap[symbol];
        if (market == undefined) {
            throw new errors_1.InvalidMarketSymbolError(symbol);
        }
        return market;
    }
    getMarketMap(mm, symbol) {
        let map = mm[symbol];
        if (map == undefined) {
            throw new errors_1.InvalidMarketSymbolError(symbol);
        }
        return map;
    }
}
exports.Marketplace = Marketplace;
//# sourceMappingURL=market.js.map