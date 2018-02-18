"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bignumber_js_1 = require("bignumber.js");
var OrderType;
(function (OrderType) {
    OrderType[OrderType["LIMIT_BUY"] = 0] = "LIMIT_BUY";
    OrderType[OrderType["LIMIT_SELL"] = 1] = "LIMIT_SELL";
    OrderType[OrderType["MARKET_BUY"] = 2] = "MARKET_BUY";
    OrderType[OrderType["MARKET_SELL"] = 3] = "MARKET_SELL";
})(OrderType = exports.OrderType || (exports.OrderType = {}));
var OrderSide;
(function (OrderSide) {
    OrderSide[OrderSide["BUY"] = 0] = "BUY";
    OrderSide[OrderSide["SELL"] = 1] = "SELL";
})(OrderSide = exports.OrderSide || (exports.OrderSide = {}));
var OrderStatus;
(function (OrderStatus) {
    OrderStatus["OPEN"] = "open";
    OrderStatus["CLOSED"] = "closed";
    OrderStatus["CANCELLED"] = "cancelled";
})(OrderStatus = exports.OrderStatus || (exports.OrderStatus = {}));
class OrderRequest {
    constructor(type, marketSymbol, amount, price, portfolioID) {
        this.type = type;
        this.marketSymbol = marketSymbol;
        this.amount = amount;
        this.price = price;
        this.portfolioID = portfolioID;
        if (type == OrderType.LIMIT_BUY || type == OrderType.MARKET_BUY) {
            this.side = OrderSide.BUY;
        }
        else {
            this.side = OrderSide.SELL;
        }
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