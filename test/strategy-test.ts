import { Strategy, StrategyJSON, TraderStrategyInterface } from '../src/models/strategy';
const ccxt = require('ccxt');
import { Num } from '../src/models/types';
import { IMarket, Marketplace } from '../src/models/market';
import { Portfolio } from '../src/models/portfolio';
import { Exchange } from '../src/models/exchange';
import { OrderRequest, OrderSide, OrderStatus } from '../src/models/order';

import { expect } from 'chai';
import 'mocha';

const BTC:string = "BTC";
const amount:Num = 10;

let api = new ccxt.binance();
let exchange:Exchange = new Exchange(api);

describe('Strategy tests', async () => {
  
  
});