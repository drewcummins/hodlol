import { Strategy, StrategyJSON, TraderStrategyInterface } from '../src/models/strategy';
const ccxt = require('ccxt');
import { Num, Scenario, ScenarioMode } from '../src/models/types';
import { IMarket, Marketplace } from '../src/models/market';
import { Portfolio } from '../src/models/portfolio';
import { Exchange } from '../src/models/exchange';
import { Trader, TraderParams, TraderJSON } from '../src/models/trader';
import { OrderRequest, OrderSide, OrderStatus } from '../src/models/order';

import { expect } from 'chai';
import 'mocha';
import { sleep, Thread } from '../src/utils';
import { MultiSignalJSON } from '../src/models/signal';

const BTC:string = "BTC";
const amount:Num = 10;

let opts:TraderParams = {
  symbol: BTC,
  amount: amount,
  backtest: "./scenarios/market-bounce.scenario",
  mock: true
}

let json:TraderJSON = {
  name: "dummy",
  exchange: "binance",
  strategies: [
    {
      fileName: "index",
      className: "Strategy",
      title: "Any--MACD,OBV",
      weight: 1,
      indicators: [
        <MultiSignalJSON>{
          fileName: "any", 
          className: "Any",
          subsignals: [
            { fileName: "macd", className: "MACD" },
            { fileName: "obv", className: "OBV" }
          ]
        }
      ]
    },
    {
      fileName: "hodl",
      className: "HODL",
      weight:1
    }
  ],
  tickers: [
    "ETH/BTC", "BTC/USDT"
  ]
}

let trader:Trader = null;

describe('Trader tests', async () => {
  before(() => {
    trader = new Trader(json, opts);
  })
  after(() => {
    Thread.killAll();
    Scenario.kill();
  })

  it('should be initialized correctly', () => {
    expect(trader).to.exist;
    expect(Scenario.getInstance().mode).to.equal(ScenarioMode.PLAYBACK);
  })

  it('should successfully run through scenario in under 30s', async () => {
    await trader.run();
  }).timeout(30000)
});