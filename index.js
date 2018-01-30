#!/usr/bin/env node

'use strict';
const commandLineArgs = require("command-line-args");
const Trader = require("./app/model/trader");
const xu = require('./app/util/exchange');

const optionDefinitions = [
  { name: 'help', alias: 'h', type: Boolean },
  { name: 'symbol', alias: 's', type: String, defaultValue: "BTC" },
  { name: 'amount', alias: 'a', type: Number },
  { name: 'trader', alias: 't', type: String, defaultOption: true},
  { name: 'backtest', alias: 'b', type: String},
  { name: 'fake', alias: 'f', type: Boolean, defaultValue: false}
];

const opts = commandLineArgs(optionDefinitions);

(async () => {
  let params = {
    symbol: opts.symbol,
    amount: opts.amount,
    backtest: opts.backtest,
    fakeOrders: opts.fake
  };

  let trader = null;
  try {
    trader = await Trader.deserialize(opts.trader, params);
  } catch(err) {
    console.log("Error:", err);
    process.exit();
  }
  console.log("Trader initialized.", params);
  await xu.sleep(1000);
  trader.run(); // start tickers/candles
})();
