"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bignumber_js_1 = require("bignumber.js");
var OrderSide;
(function (OrderSide) {
    OrderSide["BUY"] = "buy";
    OrderSide["SELL"] = "sell";
})(OrderSide = exports.OrderSide || (exports.OrderSide = {}));
var OrderType;
(function (OrderType) {
    OrderType["MARKET"] = "market";
    OrderType["LIMIT"] = "limit";
})(OrderType = exports.OrderType || (exports.OrderType = {}));
var OrderStatus;
(function (OrderStatus) {
    OrderStatus["OPEN"] = "open";
    OrderStatus["CLOSED"] = "closed";
    OrderStatus["CANCELED"] = "canceled";
})(OrderStatus = exports.OrderStatus || (exports.OrderStatus = {}));
class OrderRequest {
    constructor(type, side, marketSymbol, amount, price, portfolioID) {
        this.type = type;
        this.side = side;
        this.marketSymbol = marketSymbol;
        this.amount = amount;
        this.price = price;
        this.portfolioID = portfolioID;
    }
    /**
     * Calculates the cost of the order
     *
     * @returns cost
    */
    cost() {
        let amount = new bignumber_js_1.BigNumber(this.amount);
        let price = new bignumber_js_1.BigNumber(this.price);
        return amount.multipliedBy(price);
    }
}
exports.OrderRequest = OrderRequest;
//# sourceMappingURL=order.js.map