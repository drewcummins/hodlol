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
    OrderStatus["CANCELLED"] = "cancelled";
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
/*
let order = {
      id:        uuid(),
      timestamp: +new Date(),   // Unix timestamp in milliseconds
      status:    'open',          // 'open', 'closed', 'canceled'
      symbol:    request.market,  // symbol
      type:      'limit',         // 'market', 'limit'
      side:      'buy',           // 'buy', 'sell'
      price:     request.price,   // float price in quote currency
      amount:    request.amount,  // ordered amount of base currency
      cost:      request.price * request.amount,
      filled:    0.0,             // filled amount of base currency
      remaining: request.amount,  // remaining amount to fill
      trades:   []
    };
    this.orders.add(order);
    return order;
*/ 
//# sourceMappingURL=order.js.map