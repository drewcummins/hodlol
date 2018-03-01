import { Trader, TraderJSON } from "./models/trader";

const commandLineArgs = require("command-line-args");
// const Trader = require("./app/model/trader");
const rs = require('readline-sync');
const chrono = require('chrono-node');

import * as fs from "fs";
import { formatTimestamp } from "./utils";
import { Backfiller } from "./models/backfiller";

const optionDefinitions = [
  { name: 'help', alias: 'h', type: Boolean },
  { name: 'symbol', alias: 's', type: String, defaultValue: "BTC" },
  { name: 'amount', alias: 'a', type: Number },
  { name: 'trader', alias: 't', type: String, defaultOption: true},
  { name: 'backtest', alias: 'b', type: String},
  { name: 'mock', alias: 'm', type: Boolean, defaultValue: false}
];

const opts = commandLineArgs(optionDefinitions);

(async () => {
  let traderJSON:TraderJSON = JSON.parse(fs.readFileSync(opts.trader).toString());
  
  // if we're asking to backtest without providing a scenario file,
  // we need to go grab the backtest data
  if (opts.backtest === null) {
    let dateInput = rs.question("What time range? (This can be written naturally, e.g. 'Saturday 4pm to Monday 9am'): ");
    let [parsed] = chrono.parse(dateInput);
    let start = parsed.start.date();
    let end = parsed.end.date();
    let name = rs.question("Give this backtest a name (default is data start date): ");
    if (!name || name.length < 1) name = formatTimestamp(+start);
    const backfiller:Backfiller = new Backfiller(traderJSON);
    opts.backtest = await backfiller.run(name, +start, +end);
  }

  // don't require explicit mock
  if (!opts.mock && opts.backtest) opts.mock = true;
  
  new Trader(traderJSON, opts).run();
})();
