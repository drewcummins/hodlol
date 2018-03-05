"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const types_1 = require("./types");
const market_1 = require("./market");
const ticker_1 = require("./ticker");
const order_1 = require("./order");
const errors_1 = require("../errors");
class Exchange {
    constructor(api) {
        this.api = api;
        this.feed = { candles: new Map(), orders: new Map() };
        this.portfolios = new Map();
        this.time = 0;
        this.state = new types_1.BitfieldState();
        [this.marketsLoaded, this.feedsLoaded, this.tickersRunning, this.fundsSufficient] = this.state.init(4);
        this.dirty = this.state.add();
    }
    /**
     * Registers a portfolio for the exchange to mutate
     *
     * @param portfolio Portfolio to register
     */
    registerPortfolio(portfolio) {
        this.portfolios.set(portfolio.id, portfolio);
    }
    /**
     * Marks the exchange to process a change in ticker/order state
    */
    invalidate() {
        this.state.set(this.dirty);
    }
    /**
     * Opposite of invalidate
    */
    clean() {
        this.state.kill(this.dirty);
    }
    /**
     * Gets the name of the current API being used
     *
     * e.g. "binance"
     *
     * @returns name of API
    */
    name() {
        return this.api.name.toLowerCase();
    }
    /**
     * Indicates whether markets have been downloaded yet
     *
     * @returns boolean
    */
    hasMarkets() {
        return this.state.isSet(this.marketsLoaded);
    }
    /**
     * Indicates whether feeds have been initialized yet
     *
     * @returns boolean
    */
    hasFeeds() {
        return this.state.isSet(this.feedsLoaded);
    }
    /**
     * Indicates whether tickers have kicked off
     *
     * @returns boolean
    */
    areTickersRunning() {
        return this.state.isSet(this.tickersRunning);
    }
    /**
     * Indicates whether all things have been initalized
     *
     * @returns true if feeds and markets are loaded, false otherwise
    */
    isLoaded() {
        return this.state.isComplete();
    }
    /**
     * Indicates whether the exchange needs an update call
     *
     * @returns true if exchange dirty
    */
    isDirty() {
        return this.state.isSet(this.dirty);
    }
    /**
     * Indicates whether the funds requested are available
     *
     * @returns true if funds are available
    */
    hasSufficientFunds() {
        return this.state.isSet(this.fundsSufficient);
    }
    /**
     * Grabs marketplace from API
    */
    async loadMarketplace(tickers) {
        if (!this.state.isSet(this.marketsLoaded)) {
            let marketMap = await this.loadMarkets();
            if (tickers) {
                let clone = {};
                tickers.forEach((ticker) => clone[ticker] = marketMap[ticker]);
                marketMap = clone;
            }
            this.markets = new market_1.Marketplace(marketMap);
            this.state.set(this.marketsLoaded);
        }
    }
    /**
     * Loads all given tickers
     *
     * @param tickers tickers for feed to load
     */
    loadFeeds(tickers) {
        if (!this.state.isSet(this.feedsLoaded)) {
            for (const symbol of tickers) {
                const ticker = this.addCandlestick(symbol);
            }
            this.state.set(this.feedsLoaded);
        }
    }
    /**
     * Validates that there are sufficient funds for the given symbol
     *
     * @param fundSymbol Symbol to extract funds from
     * @param fundAmount Amount to use
     */
    async validateFunds(fundSymbol, fundAmount) {
        if (types_1.Scenario.getInstance().mode == types_1.ScenarioMode.PLAYBACK) {
            this.state.set(this.fundsSufficient);
            return true;
        }
        let balance = await this.fetchBalance();
        if (balance[fundSymbol] && balance[fundSymbol].free >= fundAmount) {
            this.state.set(this.fundsSufficient);
            return true;
        }
        throw new errors_1.InsufficientExchangeFundsError(fundSymbol, balance[fundSymbol].free, fundAmount);
    }
    /**
     * Runs all tickers (each in their own "thread")
    */
    runTickers() {
        this.feed.candles.forEach((candle) => candle.run());
        this.state.set(this.tickersRunning);
    }
    /**
     * Cleans up order tickers when status has changed to closed or cancelled
    */
    processOrderState() {
        this.feed.orders.forEach((ticker) => {
            const last = ticker.last();
            const order = last.state;
            if (last) {
                // For right now, only act if the order is completely closed
                // TODO: Deal with partial fills
                if (order.status == order_1.OrderStatus.CLOSED || order.status == order_1.OrderStatus.CANCELED) {
                    ticker.kill();
                    this.feed.orders.delete(ticker.orderID);
                    let portfolio = this.portfolios.get(ticker.portfolioID);
                    if (portfolio)
                        portfolio.fill(last);
                }
            }
        });
    }
    /**
     * Gets the given exchange API's markets
     *
     * @returns markets
    */
    async loadMarkets() {
        return await this.api.loadMarkets();
    }
    /**
     * Gets ticker data for given pair
     *
     * @param pair market pair to grab ticker info for
     *
     * @returns ticker data
     */
    async fetchTicker(pair) {
        return new types_1.Tick(await this.api.fetchTicker(pair));
    }
    /**
     * Gets candlestick (open, high, low, close, volume) data for @symbol
     *
     * @param symbol market symbol to grab
     * @param period timescale to build candlesticks from
     * @param since start time to grab data from
     *
     * @returns candlestick data
     */
    async fetchOHLCV(symbol, period = "1m", since = undefined) {
        let ohlcvs = await this.api.fetchOHLCV(symbol, period, since);
        return ohlcvs.map((ohlcv) => new types_1.OHLCV(Object.assign(ohlcv, { timestamp: ohlcv[0] })));
    }
    /**
     * Gets an order by given ID
     *
     * @param orderID ID of order to grab
     * @param symbol symbol associated with that order (don't know why exchanges operate like this)
     *
     * @return requested order if it exists
     */
    async fetchOrder(orderID, symbol) {
        return new types_1.Tick(await this.api.fetchOrder(orderID, symbol));
    }
    /**
     * Cancels an order by id
     *
     * @param orderID ID of order to cancel
     *
     * @return
     */
    async cancelOrder(orderID, symbol) {
        return await this.api.cancelOrder(orderID, symbol);
    }
    /**
     * Gets exchange balance
     *
     * @returns balance hash
    */
    async fetchBalance() {
        return await this.api.fetchBalance();
    }
    /**
     * Creates an order according to the given OrderRequest
     *
     * @param request Order request
     *
     * @returns the newly created order
     * @throws InvalidOrderTypeError if an invalid order type is set
     */
    async createOrder(request) {
        let order = null;
        let portfolio = this.portfolios.get(request.portfolioID);
        portfolio.reserve(request);
        switch (request.type) {
            case order_1.OrderType.LIMIT:
                switch (request.side) {
                    case order_1.OrderSide.BUY:
                        order = new types_1.Order(await this.api.createLimitBuyOrder(request.market.symbol, types_1.BNF(request.amount), types_1.BNF(request.price)));
                        break;
                    case order_1.OrderSide.SELL:
                        order = new types_1.Order(await this.api.createLimitSellOrder(request.market.symbol, types_1.BNF(request.amount), types_1.BNF(request.price)));
                        break;
                    default:
                        throw new errors_1.InvalidOrderSideError(request);
                }
                break;
            case order_1.OrderType.MARKET:
                switch (request.side) {
                    case order_1.OrderSide.BUY:
                        order = new types_1.Order(await this.api.createMarketBuyOrder(request.market.symbol, types_1.BNF(request.amount), types_1.BNF(request.price)));
                        break;
                    case order_1.OrderSide.SELL:
                        order = new types_1.Order(await this.api.createMarketSellOrder(request.market.symbol, types_1.BNF(request.amount), types_1.BNF(request.price)));
                        break;
                    default:
                        throw new errors_1.InvalidOrderSideError(request);
                }
                break;
            default:
                throw new errors_1.InvalidOrderTypeError(request);
        }
        this.addOrder(order, portfolio.id);
        return order;
    }
    /**
     * Creates a new candlestick ticker for @symbol
     *
     * @param symbol market symbol to track candlestick data for
     *
     * @returns the candleticker
     */
    addCandlestick(symbol) {
        const ticker = new ticker_1.OHLCVTicker(this, symbol);
        this.feed.candles.set(symbol, ticker);
        return ticker;
    }
    /**
     * Creates a ticker to follow an order
     *
     * @param order order to track
     *
     * @returns the OrderTicker
     */
    addOrder(order, portfolioID) {
        const ticker = new ticker_1.OrderTicker(this, order, portfolioID);
        this.feed.orders.set(order.state.id, ticker);
        ticker.run();
        return ticker;
    }
    /**
     * Calculates price for @base in @quote units
     *
     * @param base base symbol
     * @param quote quote symbol
     *
     * @returns price value
     */
    async price(base, quote) {
        let path = this.path(base, quote);
        if (path) {
            let price = 1;
            for (var i = 0; i < path.length; i++) {
                let pair = path[i];
                let ticker = this.feed.candles.get(pair);
                if (ticker && ticker.length() > 0) {
                    let tick = ticker.last();
                    price *= tick.close;
                }
                else {
                    let tick = await this.fetchOHLCV(pair);
                    price *= tick[tick.length - 1].close;
                }
            }
            return price;
        }
        else {
            return NaN;
        }
    }
    /**
     * Calculates a market path from market a to market b
     *
     * @param a symbol to start from
     * @param b symbol to go to
     *
     * @returns the path if one exists, null otherwise
     */
    path(a, b) {
        let path = this._path(a, b);
        if (!path) {
            path = this._path(b, a);
            if (path)
                path = path.reverse();
        }
        return path;
    }
    _path(a, b) {
        try {
            let markets = this.markets.getMarketsWithBase(a);
            if (markets[b])
                return [markets[b].symbol];
            let path = null;
            for (const sym in markets) {
                let p = this._path(sym, b);
                if (p == null)
                    continue;
                if (path == null || p.length < path.length - 1) {
                    path = [markets[sym].symbol].concat(p);
                }
            }
            return path;
        }
        catch (error) {
            return null;
        }
    }
}
exports.Exchange = Exchange;
//# sourceMappingURL=exchange.js.map