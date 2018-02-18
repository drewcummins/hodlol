"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class InvalidMarketSymbolError extends Error {
    constructor(symbol) {
        super(`Invalid market symbol provided: ${symbol}`);
    }
}
exports.InvalidMarketSymbolError = InvalidMarketSymbolError;
class InsufficientFundsError extends Error {
    constructor(request) {
        super(`Insufficient funds for request: ${request}`);
    }
}
exports.InsufficientFundsError = InsufficientFundsError;
class InvalidExchangeNameError extends Error {
    constructor(name) {
        super(`Invalid exchange name error: ${name}. No such exchange exists on CCXT.`);
    }
}
exports.InvalidExchangeNameError = InvalidExchangeNameError;
//# sourceMappingURL=exchange-error.js.map