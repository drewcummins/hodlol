"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class InvalidMarketSymbolError extends Error {
    constructor(symbol) {
        super(`Invalid market symbol provided: ${symbol}`);
    }
}
exports.InvalidMarketSymbolError = InvalidMarketSymbolError;
class InsufficientExchangeFundsError extends Error {
    constructor(symbol, amount, funds) {
        super(`Insufficient funds on exchange: Expected ${amount} ${symbol} to be >= ${funds} ${symbol}`);
    }
}
exports.InsufficientExchangeFundsError = InsufficientExchangeFundsError;
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
class InvalidSignalError extends Error {
    constructor(indicator, signal) {
        super(`Invalid signal from ${indicator}: ${signal}`);
    }
}
exports.InvalidSignalError = InvalidSignalError;
class InvalidOrderTypeError extends Error {
    constructor(orderRequest) {
        super(`Invalid order type: ${orderRequest}`);
    }
}
exports.InvalidOrderTypeError = InvalidOrderTypeError;
class InvalidOrderSideError extends Error {
    constructor(orderRequest) {
        super(`Invalid order side: ${orderRequest}`);
    }
}
exports.InvalidOrderSideError = InvalidOrderSideError;
class FileMissingError extends Error {
    constructor(filename, type) {
        super(`No ${type} file found when attempting to read ${filename}`);
    }
}
exports.FileMissingError = FileMissingError;
class BacktestFileMissingError extends FileMissingError {
    constructor(filename) {
        super(filename, 'backtest');
    }
}
exports.BacktestFileMissingError = BacktestFileMissingError;
class ScenarioFileMissingError extends FileMissingError {
    constructor(filename) {
        super(filename, 'scenario');
    }
}
exports.ScenarioFileMissingError = ScenarioFileMissingError;
class InvalidCSVError extends Error {
    constructor(csv, type) {
        super(csv + type);
    }
}
exports.InvalidCSVError = InvalidCSVError;
//# sourceMappingURL=index.js.map