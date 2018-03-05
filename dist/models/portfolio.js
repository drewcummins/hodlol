"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const uuid = require('uuid/v4');
const types_1 = require("./types");
const order_1 = require("./order");
const errors_1 = require("../errors");
class Portfolio {
    constructor(markets, fundSymbol = 'BTC', fundAmount = 10) {
        this.markets = markets;
        this.fundSymbol = fundSymbol;
        this.fundAmount = fundAmount;
        this.balances = new Map();
        this.id = uuid();
        this.balances.set(fundSymbol, { free: fundAmount, reserved: 0 });
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
        return this.balances.get(symbol);
    }
    /**
     * Gets market associated with symbol
     *
     * @param marketSymbol market symbol to get market for
     *
     * @returns Relevant market
     * @throws InvalidMarketSymbolError if symbol doesn't exist in markets
     */
    marketBySymbol(marketSymbol) {
        return this.markets.getWithSymbol(marketSymbol);
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
     * @throws InvalidOrderSideError if request.side not set correctly
     */
    hasSufficientFunds(request) {
        let [base, quote] = this.balanceByMarket(request.market.symbol);
        if (request.side == order_1.OrderSide.BUY) {
            return types_1.BN(quote.free).isGreaterThanOrEqualTo(request.cost());
        }
        else if (request.side == order_1.OrderSide.SELL) {
            return types_1.BN(base.free).isGreaterThanOrEqualTo(request.cost());
        }
        else {
            throw new errors_1.InvalidOrderSideError(request);
        }
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
            throw new errors_1.InsufficientFundsError(request);
        }
        let market = this.markets.getWithSymbol(request.market.symbol);
        let symbol = request.side === order_1.OrderSide.BUY ? market.quote : market.base;
        this.removeFree(symbol, request.cost());
        this.addReserved(symbol, request.cost());
    }
    /**
     * Undoes a reservation made for a request
     *
     * @param request request to undo
     */
    undo(request) {
        let market = this.markets.getWithSymbol(request.market.symbol);
        let symbol = request.side === order_1.OrderSide.BUY ? market.quote : market.base;
        this.removeReserved(symbol, request.cost());
        this.addFree(symbol, request.cost());
    }
    /**
     * Fills the given order.
     *
     * This mutates the portfolio state.
     *
     * @param order Order to fill
     */
    fill(order) {
        let market = this.markets.getWithSymbol(order.state.symbol);
        switch (order.state.side) {
            case order_1.OrderSide.BUY:
                this.removeReserved(market.quote, order.state.cost);
                this.addFree(market.base, order.state.filled);
                break;
            case order_1.OrderSide.SELL:
                this.removeReserved(market.base, order.state.filled);
                this.addFree(market.quote, order.state.cost);
                break;
            default:
                break;
        }
    }
    addFree(symbol, amount) {
        let balance = this.balance(symbol);
        balance.free = types_1.BN(balance.free).plus(types_1.BN(amount));
    }
    addReserved(symbol, amount) {
        let balance = this.balance(symbol);
        balance.reserved = types_1.BN(balance.reserved).plus(types_1.BN(amount));
    }
    removeFree(symbol, amount) {
        this.addFree(symbol, -amount);
    }
    removeReserved(symbol, amount) {
        this.addReserved(symbol, -amount);
    }
    ensureBalance(symbol) {
        if (!this.balances.has(symbol))
            this.balances.set(symbol, { free: 0, reserved: 0 });
    }
    /**
     * Gets the value of the portfolio in @quote
     *
     * @param quote Quote symbol to get price in
     * @param price Price function (on exchange)--this is sloppy
     *
     * @returns portfolio value
     */
    async value(quote = 'USDT', price) {
        let value = { all: { free: types_1.BN(0), reserved: types_1.BN(0) } };
        let balances = this.balances.keys();
        for (let base of balances) {
            if (base == quote) {
                let balance = this.balances.get(base);
                value.all.free = types_1.BN(value.all.free).plus(balance.free);
                value.all.reserved = types_1.BN(value.all.reserved).plus(balance.reserved);
                value[base] = balance;
                continue;
            }
            let rate = types_1.BN(await price(base, quote));
            let balance = this.balances.get(base);
            value[base] = { free: types_1.BN(balance.free).times(rate), reserved: types_1.BN(balance.reserved).times(rate) };
            value.all.free = types_1.BN(value.all.free).plus(value[base].free);
            value.all.reserved = types_1.BN(value.all.reserved).plus(value[base].reserved);
        }
        return value;
    }
}
exports.Portfolio = Portfolio;
//# sourceMappingURL=portfolio.js.map