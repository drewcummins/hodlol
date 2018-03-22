"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const exchange_1 = require("../exchange");
const types_1 = require("../types");
const errors_1 = require("../../errors");
const utils_1 = require("../../utils");
const portfolio_1 = require("../portfolio");
const mock_api_1 = require("../mock-api");
const config_1 = require("../../config");
const mkdirp = require("mkdirp");
const ccxt = require('ccxt');
const dateFormat = require('dateformat');
const colors = require('ansicolors');
const columnify = require('columnify');
class Trader {
    /**
     * Creates a new Trader
     *
     * @param source The trader json that describes how to initialize strategies etc.
     * @param params Parameters that describe how to interact with an exchange
     */
    constructor(source, params) {
        this.source = source;
        this.params = params;
        this.strategies = [];
        this.print = true;
        if (params.backtest) {
            types_1.Scenario.create(params.backtest);
        }
        else {
            types_1.Scenario.createWithName(utils_1.formatTimestamp(+new Date()), +new Date(), 0);
            mkdirp.sync(`./data/${source.exchange}/${types_1.Scenario.getInstance().id}`);
        }
        let apiClass = ccxt[source.exchange];
        if (!apiClass)
            throw new errors_1.InvalidExchangeNameError(source.exchange);
        let apiCreds = config_1.config[source.exchange];
        let api = new apiClass(apiCreds);
        // This is a little weird
        // Basically we use a "real" API no matter what to pull markets
        // Everything else gets faked when mocked
        if (params.mock)
            api = new mock_api_1.MockAPI(api);
        this.thread = new utils_1.Thread();
        this.exchange = new exchange_1.Exchange(api);
    }
    async stepExchange() {
        if (this.exchange.isDirty()) {
            this.exchange.processOrderState();
            for (let strategy of this.strategies) {
                await strategy.tick();
            }
            this.exchange.clean();
            this.print = true;
        }
    }
    async initStrategies() {
        const feed = this.exchange.feed;
        const sum = this.source.strategies.reduce((mem, strategy) => mem + strategy.weight, 0);
        const tsi = {
            fundSymbol: this.params.symbol,
            fundAmount: this.params.amount,
            feed: this.exchange.feed,
            requestOrderHandler: this.consider.bind(this)
        };
        for (let stratJSON of this.source.strategies) {
            // this normalizes the weights in all provided strategies and
            // divvies up the trader's total funds accordingly
            const amount = tsi.fundAmount * stratJSON.weight / sum;
            if (amount > 0) {
                let portfolio = new portfolio_1.Portfolio(this.exchange.markets, tsi.fundSymbol, amount);
                this.exchange.registerPortfolio(portfolio);
                const strat = await utils_1.load(stratJSON.fileName, `models/strategy`);
                const stratClass = strat[stratJSON.className];
                let strategy = new stratClass(portfolio, stratJSON, tsi);
                this.strategies.push(strategy);
            }
        }
    }
    async initExchange() {
        await this.exchange.validateFunds(this.params.symbol, this.params.amount);
        await this.exchange.loadFeeds(this.source.tickers);
        await this.exchange.loadMarketplace(this.source.tickers);
        await this.initStrategies();
    }
    /**
     * Kicks off everything necessary for the exchange and initializes all strategies
    */
    async run() {
        await this.initExchange();
        if (this.params.mock) {
            let api = this.exchange.api;
            await api.loadTickers(this.exchange.feed);
            // kick off the "server" if we're mocking
            api.run();
        }
        this.exchange.runTickers();
        for (const strategy of this.strategies) {
            await strategy.before();
        }
        while (this.thread.isRunning()) {
            await this.stepExchange();
            if (this.params.backtest) {
                if (this.thread.hasCycled(100))
                    this.printPerformance();
                types_1.Scenario.getInstance().time += 10000;
                if (types_1.Scenario.getInstance().time > types_1.Scenario.getInstance().end) {
                    utils_1.Thread.killAll();
                    this.printPerformance();
                }
            }
            else {
                if (this.print)
                    this.printPerformance();
                types_1.Scenario.getInstance().time = +new Date();
            }
            await this.thread.sleep(1);
        }
        for (const strategy of this.strategies) {
            await strategy.after();
        }
    }
    /**
     * Kills this trader's run thread
     *
     * This will leave "orphaned threads"
     * To kill everything call @Thread.killAll()
    */
    kill() {
        this.thread.kill();
    }
    /**
     * Asks the trader to "consider" an order
     *
     * @param strategy Strategy requesting the order
     * @param orderRequest Order being requested
     *
     * @returns the created order if successful
     */
    async consider(strategy, orderRequest) {
        // this is not a clever trader--just create an order
        return this.exchange.createOrder(orderRequest);
    }
    async printPerformance() {
        if (this.strategies.length == 0)
            return;
        let scenario = types_1.Scenario.getInstance();
        let out = "\x1Bc\n";
        var date;
        if (scenario.mode == types_1.ScenarioMode.PLAYBACK) {
            let dateStart = colors.magenta(dateFormat(scenario.start, "mmm d, h:MM:ssTT"));
            let dateEnd = colors.magenta(dateFormat(scenario.end, "mmm d, h:MM:ssTT"));
            date = colors.magenta(dateFormat(Math.min(scenario.time, scenario.end), "mmm d, h:MM:ssTT"));
            out += ` | Backtesting from ${dateStart} to ${dateEnd}\n\n`;
        }
        let columns = [];
        for (var i = 0; i < this.strategies.length; i++) {
            let strategy = this.strategies[i];
            try {
                let value = await strategy.portfolio.value("USDT", this.exchange.price.bind(this.exchange));
                if (!strategy.originalValue)
                    strategy.originalValue = value;
                let total = types_1.BN(value.all.free).plus(value.all.reserved).toFixed(2);
                let originalTotal = types_1.BN(strategy.originalValue.all.free).plus(strategy.originalValue.all.reserved).toFixed(2);
                let valstr = colors.green("$" + total);
                let ovalstr = colors.green("$" + originalTotal);
                columns.push({ strategy: colors.blue(strategy.title), value: valstr, "original value": ovalstr });
            }
            catch (err) {
                throw err;
            }
        }
        let table = columnify(columns, { minWidth: 20 });
        table = table.split("\n").join("\n | ");
        // console.log(" | " + table);
        out += " | " + table + "\n";
        if (types_1.Scenario.getInstance().mode == types_1.ScenarioMode.PLAYBACK) {
            out += (`\n | ${date}\n`);
        }
        console.log(`\n${out}\n`);
        this.print = false;
    }
}
exports.Trader = Trader;
//# sourceMappingURL=index.js.map