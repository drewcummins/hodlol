"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const types_1 = require("./types");
const market_1 = require("./market");
const ticker_1 = require("./ticker");
const order_1 = require("./order");
class Exchange {
    constructor(api) {
        this.api = api;
        this.feed = { candles: new Map(), orders: new Map() };
        this.time = 0;
        this.state = new types_1.BitfieldState();
        [this.marketsLoaded, this.feedsLoaded] = this.state.init(2);
        this.dirty = this.state.add(false, false);
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
     * Indicates whether all things have been initalized
     *
     * @returns true if feeds and markets are loaded, false otherwise
    */
    isLoaded() {
        return this.state.isComplete();
    }
    /**
     * Grabs marketplace from API
    */
    async loadMarketplace() {
        if (!this.state.isSet(this.marketsLoaded)) {
            let marketMap = await this.loadMarkets();
            this.markets = new market_1.Marketplace(marketMap);
            this.state.set(this.marketsLoaded);
        }
    }
    /**
     * Loads all given tickers
     *
     * @param tickers tickers for feed to load
     */
    async loadFeeds(tickers) {
        if (!this.state.isSet(this.feedsLoaded)) {
            for (const symbol of tickers) {
                const ticker = this.addCandlestick(symbol);
                // if backtest
                await ticker.read();
                ticker.run();
            }
            this.state.set(this.feedsLoaded);
        }
    }
    /**
     * Cleans up order tickers when status has changed to closed or cancelled
    */
    processOrderState() {
        Array.from(this.feed.orders.values()).forEach((ticker) => {
            const last = ticker.last();
            if (last) {
                if (last.status == order_1.OrderStatus.CLOSED || last.status == order_1.OrderStatus.CANCELLED) {
                    ticker.kill = true;
                    this.feed.orders.delete(ticker.orderID);
                    // let portfolio = this.portfolios[order.portfolioID];
                    // if (portfolio) portfolio.fill(last);
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
        return await this.api.fetchTicker(pair);
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
        return await this.api.fetchOHLCV(symbol, period, since);
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
        return await this.api.fetchOrder(orderID, symbol);
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
     * Creates a new candlestick ticker for @symbol
     *
     * @param symbol market symbol to track candlestick data for
     *
     * @returns the candleticker
     */
    addCandlestick(symbol) {
        const ticker = new ticker_1.CandleTicker(this, symbol);
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
    addOrder(order) {
        const ticker = new ticker_1.OrderTicker(this, order);
        this.feed.orders.set(order.id, ticker);
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
                    let tick = ticker.last(); // last here means most recent tick
                    price *= Number(tick.close);
                }
                else {
                    let tick = await this.fetchTicker(pair);
                    price *= tick.close;
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