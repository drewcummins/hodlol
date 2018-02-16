"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const uuid = require('uuid/v4');
const types_1 = require("./types");
const order_1 = require("./order");
const exchange_error_1 = require("../errors/exchange-error");
class Portfolio {
    constructor(markets, fundSymbol = 'BTC', fundAmount = 10) {
        this.markets = markets;
        this.fundSymbol = fundSymbol;
        this.fundAmount = fundAmount;
        this.id = uuid();
        this.balances = {};
        this.balances[fundSymbol] = { free: types_1.BN(fundAmount), reserved: types_1.BN(0) };
    }
    /**
     * Gets balance for the given currency
     *
     * @param symbol currency symbol to get balance for
     *
     * @returns balance
     */
    balance(symbol) {
        this.ensureBalance(symbol);
        return this.balances[symbol];
    }
    /**
     * Gets balance for base and quote of given market
     *
     * @param marketSymbol market symbol to get balance of
     *
     * @returns base and quote balances
     * @throws InvalidMarketSymbolError if symbol doesn't exist in markets
     */
    balanceByMarket(marketSymbol) {
        let market = this.markets.getWithSymbol(marketSymbol);
        return [market.base, market.quote].map((symbol) => this.balance(symbol));
    }
    /**
     * Checks whether there are sufficient funds for the given request
     *
     * @param request OrderRequest to verify funds for
     *
     * @returns whethere there are sufficient funds or not
     */
    hasSufficientFunds(request) {
        let [base, quote] = this.balanceByMarket(request.marketSymbol);
        if (request.type == order_1.OrderType.LIMIT_BUY) {
            return quote.free.isGreaterThanOrEqualTo(request.cost());
        }
        else if (request.type == order_1.OrderType.LIMIT_SELL) {
            return base.free.isGreaterThanOrEqualTo(request.amount);
        }
        return false;
    }
    /**
     * Reserves the appropriate funds necessary to make the given request.
     *
     * This mutates the portfolio state.
     *
     * @param request request to accommodate
     */
    reserve(request) {
        if (!this.hasSufficientFunds(request)) {
            throw new exchange_error_1.InsufficientFundsError(request);
        }
        let market = this.markets.getWithSymbol(request.marketSymbol);
        switch (request.side) {
            case order_1.OrderSide.BUY:
                this.removeFree(market.quote, request.cost());
                this.addReserved(market.quote, request.cost());
                break;
            case order_1.OrderSide.SELL:
                this.removeFree(market.base, request.amount);
                this.addReserved(market.base, request.amount);
                break;
            default:
                break;
        }
    }
    /**
     * Fills the given order.
     *
     * This mutates the portfolio state.
     *
     * @param order Order to fill
     */
    fill(order) {
        let market = this.markets.getWithSymbol(order.symbol);
        switch (order.side) {
            case order_1.OrderSide.BUY:
                this.removeReserved(market.quote, order.cost);
                this.addFree(market.base, order.filled);
                break;
            case order_1.OrderSide.SELL:
                this.removeReserved(market.base, order.filled);
                this.addReserved(market.quote, order.cost);
                break;
            default:
                break;
        }
    }
    addFree(symbol, amount) {
        let balance = this.balance(symbol);
        balance.free = balance.free.plus(amount);
    }
    addReserved(symbol, amount) {
        let balance = this.balance(symbol);
        balance.reserved = balance.reserved.plus(amount);
    }
    removeFree(symbol, amount) {
        this.addFree(symbol, -amount);
    }
    removeReserved(symbol, amount) {
        this.addReserved(symbol, -amount);
    }
    ensureBalance(symbol) {
        if (!this.balances[symbol])
            this.balances[symbol] = { free: types_1.BN(0), reserved: types_1.BN(0) };
    }
}
exports.Portfolio = Portfolio;
//# sourceMappingURL=portfolio.js.map