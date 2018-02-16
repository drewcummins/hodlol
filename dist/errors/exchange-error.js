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
//# sourceMappingURL=exchange-error.js.map