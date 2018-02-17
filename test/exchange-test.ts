import { BitState, BitfieldState } from '../src/models/types';
import { Exchange } from '../src/models/exchange';
const ccxt = require('ccxt');
import { expect } from 'chai';
import 'mocha';

describe('Series tests', async () => {

  let state = new BitfieldState();
  it('should init state masks correctly', () => {
    let substates = state.init(3);
    expect(state.isComplete()).to.be.false;
    substates.forEach((substate) => expect(state.isSet(substate)).to.be.false);
    let substate = substates.pop();
    state.set(substate);
    expect(state.isComplete()).to.be.false;
    expect(state.isSet(substate)).to.be.true;
    substates.forEach((substate) => expect(state.isSet(substate)).to.be.false);
    substate = substates.pop();
    state.set(substate);
    expect(state.isComplete()).to.be.false;
    expect(state.isSet(substate)).to.be.true;
    substates.forEach((substate) => expect(state.isSet(substate)).to.be.false);
    substate = substates.pop();
    state.set(substate);
    expect(state.isComplete()).to.be.true;
    expect(state.isSet(substate)).to.be.true;
    state.kill(substate);
    expect(state.isComplete()).to.be.false;
    expect(state.isSet(substate)).to.be.false;
    state.set(substate);
    expect(state.isComplete()).to.be.true;
    expect(state.isSet(substate)).to.be.true;
  });

  let api = new ccxt.binance();
  let exchange:Exchange = new Exchange(api);

  it('should initialize exchange correctly', async () => {
    expect(exchange).to.exist;
    expect(exchange.hasMarkets()).to.be.false;
    expect(exchange.hasFeeds()).to.be.false;
    expect(exchange.isLoaded()).to.be.false;
    await exchange.loadMarketplace();
    expect(exchange.hasMarkets()).to.be.true;
    expect(exchange.hasFeeds()).to.be.false;
    expect(exchange.isLoaded()).to.be.false;
    await exchange.loadFeeds(["XMR/BTC", "BTC/USDT"]);
    expect(exchange.hasMarkets()).to.be.true;
    expect(exchange.hasFeeds()).to.be.true;
    expect(exchange.isLoaded()).to.be.true;
  });

  it('should calculate path from XMR -> USDT', () => {
    let path = exchange.path("XMR", "USDT");
    expect(path).to.exist;
    expect(path.length).to.equal(2);
    expect(path[0]).to.equal("XMR/BTC");
    expect(path[1]).to.equal("BTC/USDT");
  });

  it('should calculate path from USDT -> XMR', () => {
    let path = exchange.path("USDT", "XMR");
    expect(path).to.exist;
    expect(path.length).to.equal(2);
    expect(path[1]).to.equal("XMR/BTC");
    expect(path[0]).to.equal("BTC/USDT");
  });

  it('should calculate price of XMR in USDT', async () => {
    let price = await exchange.price("XMR", "USDT");
    expect(price).to.be.a('number');
    expect(price).to.be.greaterThan(0);
  });
});