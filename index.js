#!/usr/bin/env node

'use strict';
const commandLineArgs = require("command-line-args");
const Trader = require("./app/model/trader");
const xu = require('./app/util/exchange');
const rs = require('readline-sync');
const chrono = require('chrono-node');
const Backfiller = require("./app/model/base/backfiller");

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
  // if we're asking to backtest without providing a scenario file,
  // we need to go grab the backtest data
  if (opts.backtest === null) {
    let dateInput = rs.question("What time range? (This can be written naturally, e.g. 'Saturday 4pm to Monday 9am'): ");
    let [parsed] = chrono.parse(dateInput);
    let start = parsed.start.date();
    let end = parsed.end.date();
    let name = rs.question("Give this backtest a name (default is data start date): ");
    if (!name || name.length < 1) name = xu.dateFormat(+start);
    let backfiller = new Backfiller(opts.trader);
    await backfiller.run(name, +start, +end);
    opts.backtest = backfiller.scenarioPath;
  }


  let params = {
    symbol: opts.symbol,
    amount: opts.amount,
    backtest: opts.backtest,
    fakeOrders: opts.fake
  };

  let trader = null;
  try {
    console.log("Loading Trader...")
    trader = await Trader.deserialize(opts.trader, params);
  } catch(err) {
    console.log("Error:", err);
    process.exit();
  }
  console.log("Trader initialized.", JSON.parse(trader.serialize()));
  await xu.sleep(1000);
  trader.run(); // start tickers/candles
})();
