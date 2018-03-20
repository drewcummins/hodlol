"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const types_1 = require("./types");
const uuid = require('uuid/v4');
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
    constructor(type, side, market, amount, price, portfolioID) {
        this.type = type;
        this.side = side;
        this.market = market;
        this.amount = amount;
        this.price = price;
        this.portfolioID = portfolioID;
        this.id = uuid();
    }
    cost() {
        if (this.side === OrderSide.BUY) {
            return types_1.BN(this.amount).times(this.price);
        }
        else {
            return this.amount;
        }
    }
    benefit() {
        if (this.side === OrderSide.BUY) {
            return this.amount;
        }
        else {
            return types_1.BN(this.amount).times(this.price);
        }
    }
    feeCoefficient() {
        return OrderRequest.feeCoefficient(this.side, this.market.taker);
    }
    static feeCoefficient(side, fee) {
        if (side == OrderSide.BUY) {
            return types_1.BN(fee).plus(1);
        }
        return types_1.BN(1).minus(types_1.BN(fee));
    }
}
exports.OrderRequest = OrderRequest;
class MarketOrderRequest extends OrderRequest {
    constructor(side, market, amount, price, portfolioID) {
        super(OrderType.MARKET, side, market, amount, price, portfolioID);
    }
}
exports.MarketOrderRequest = MarketOrderRequest;
class LimitOrderRequest extends OrderRequest {
    constructor(side, market, amount, price, portfolioID) {
        super(OrderType.LIMIT, side, market, amount, price, portfolioID);
    }
    static buyMaxWithBudget(market, budget, price, portfolioID) {
        // amount = b/(p*(1+f))
        let feeExponent = OrderRequest.feeCoefficient(OrderSide.BUY, market.taker);
        let amount = types_1.BN(budget).dividedBy(types_1.BN(price).multipliedBy(feeExponent));
        return new LimitOrderRequest(OrderSide.BUY, market, amount, price, portfolioID);
    }
}
exports.LimitOrderRequest = LimitOrderRequest;
// these are just for convenience--provide no functionality except omitting side
class MarketBuyOrderRequest extends MarketOrderRequest {
    constructor(market, amount, price, portfolioID) {
        super(OrderSide.BUY, market, amount, price, portfolioID);
    }
}
exports.MarketBuyOrderRequest = MarketBuyOrderRequest;
class MarketSellOrderRequest extends MarketOrderRequest {
    constructor(market, amount, price, portfolioID) {
        super(OrderSide.SELL, market, amount, price, portfolioID);
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