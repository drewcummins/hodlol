'use strict';

const config = require('../../../config');
const xu = require('../../util/exchange');
const Exchange = require('../base/exchange');
const mkdirp = require("mkdirp");
const fs = require("fs");

class Backfiller {
  constructor(filepath) {
    this.filepath = filepath;
  }

  async run(name, a, b) {
    const json = JSON.parse(fs.readFileSync(this.filepath));
    config.dateID = name;
    config.record = true;
    mkdirp.sync(`./data/${json.exchange}/${config.dateID}`);
    let api = xu.getExchange(json.exchange);
    this.exchange = await Exchange.FromAPI(api);
    this.exchange.addTickers(json.tickers);
    this.exchange.time = a;
    let tickers = Object.values(this.exchange.feed.tickers);
    for (let ticker of tickers) {
      console.log(`Pulling ${ticker.symbol} from ${this.exchange.name}`)
      let last = ticker.last();
      while (last == null || last.timestamp < b) {
        await ticker.step();
        last = ticker.last();
        await xu.sleep(100);
      }
    }
    let scenario = {
      date_id: name,
      start: a,
      end: b
    }
    this.scenarioPath = `./scenarios/${name}.scenario`;
    fs.writeFileSync(this.scenarioPath, JSON.stringify(scenario));
    console.log("Wrote scenario to", this.scenarioPath);
  }
}

module.exports = Backfiller;
