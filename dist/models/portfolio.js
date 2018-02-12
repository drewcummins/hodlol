'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const uuid = require('uuid/v4');
const bignumber_js_1 = require("bignumber.js");
const FREE = "free";
const RESERVED = "reserved";
class Portfolio {
    constructor() {
        this.id = uuid();
        this.balances = {};
    }
    ensureBalance(symbol) {
        if (!this.balances[symbol])
            this.balances[symbol] = { free: new bignumber_js_1.BigNumber(0), reserved: new bignumber_js_1.BigNumber(0) };
    }
    balance(symbol) {
        this.ensureBalance(symbol);
        return this.balances[symbol];
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
}
exports.Portfolio = Portfolio;
//# sourceMappingURL=portfolio.js.map