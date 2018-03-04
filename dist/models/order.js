"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const types_1 = require("./types");
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
    constructor(type, side, market, portfolioID) {
        this.type = type;
        this.side = side;
        this.market = market;
        this.portfolioID = portfolioID;
    }
    feeExponent() {
        return OrderRequest.feeExponent(this.side, this.market.taker);
    }
    static feeExponent(side, fee) {
        if (side == OrderSide.BUY) {
            return types_1.BN(fee).plus(1);
        }
        return types_1.BN(1).minus(types_1.BN(fee));
    }
}
exports.OrderRequest = OrderRequest;
class MarketOrderRequest extends OrderRequest {
    constructor(side, market, balance, portfolioID) {
        super(OrderType.MARKET, side, market, portfolioID);
        this.balance = balance;
    }
    cost() {
        return this.balance;
    }
}
exports.MarketOrderRequest = MarketOrderRequest;
class LimitOrderRequest extends OrderRequest {
    constructor(side, market, amount, price, portfolioID) {
        super(OrderType.MARKET, side, market, portfolioID);
        this.amount = amount;
        this.price = price;
    }
    cost() {
        let amount = types_1.BN(this.amount);
        let price = types_1.BN(this.price);
        return amount.multipliedBy(price).multipliedBy(this.feeExponent());
    }
    static buyMaxWithBudget(market, budget, price, portfolioID) {
        // amount = b/(p*(1+f))
        let feeExponent = OrderRequest.feeExponent(OrderSide.BUY, market.taker);
        let amount = types_1.BN(budget).dividedBy(types_1.BN(price).multipliedBy(feeExponent));
        return new LimitOrderRequest(OrderSide.BUY, market, amount, price, portfolioID);
    }
}
exports.LimitOrderRequest = LimitOrderRequest;
// these are just for convenience--provide no functionality except omitting side
class MarketBuyOrderRequest extends MarketOrderRequest {
    constructor(market, balance, portfolioID) {
        super(OrderSide.BUY, market, balance, portfolioID);
    }
}
exports.MarketBuyOrderRequest = MarketBuyOrderRequest;
class MarketSellOrderRequest extends MarketOrderRequest {
    constructor(market, balance, portfolioID) {
        super(OrderSide.SELL, market, balance, portfolioID);
    }
}
exports.MarketSellOrderRequest = MarketSellOrderRequest;
class LimitBuyOrderRequest extends LimitOrderRequest {
    constructor(market, amount, price, portfolioID) {
        super(OrderSide.BUY, market, amount, price, portfolioID);
    }
}
exports.LimitBuyOrderRequest = LimitBuyOrderRequest;
class LimitSellOrderRequest extends LimitOrderRequest {
    constructor(market, amount, price, portfolioID) {
        super(OrderSide.SELL, market, amount, price, portfolioID);
    }
}
exports.LimitSellOrderRequest = LimitSellOrderRequest;
//# sourceMappingURL=order.js.map