var expect = require('chai').expect;
let fin = require('../app/model/fin');

const timestamp = + new Date()
const priceValue = 100;
let price = new fin.Price(priceValue, timestamp);

const base = "XRB";
const quote = "BTC";
let pair = new fin.Pair(base, quote);

let asset = new fin.Asset(pair, price.x, 10, price.t);

describe('Initialize Price', function() {
  it('should initialize Price object', function() {
    expect(price.x).to.equal(priceValue);
    expect(price.t).to.equal(timestamp);
  });
});


describe('Initialize Pair', function() {
  it('should host supplied pair values', function() {
    expect(pair.base).to.equal(base);
    expect(pair.quote).to.equal(quote);
    expect(pair.prices.length).to.equal(0);
  });

  it('should have correct symbol value', function() {
    expect(pair.symbol()).to.equal(base + "-" + quote);
  });

  it('should add a value to the pair', function() {
    pair.push(price);
    expect(pair.prices.length).to.equal(1);
  });
});


describe('Asset playground', function() {
  it('should initialize Asset object', function() {
    expect(asset.symbol).to.equal(pair.symbol());
    expect(asset.paid.x).to.equal(price.x);
    expect(asset.paid.t).to.equal(price.t);
    expect(asset.currentValue()).to.equal(asset.initialValue());
  });
  let p1 = new fin.Price(price.x + 10, + new Date());
  it('should add new price to pair', function() {
    pair.push(p1);
    expect(pair.prices.length).to.equal(2);
    expect(pair.currentPrice()).to.equal(p1);
  });
  it('should change asset values accordingly', function() {
    expect(asset.currentValue()).to.equal(asset.amount * p1.x);
    expect(asset.currentDelta()).to.equal(p1.x - asset.paid.x);
    expect(asset.currentGrowth()).to.equal(p1.x/asset.paid.x);
    expect(asset.currentValue()).to.equal(asset.valueAtPrice(p1));
    expect(asset.currentDelta()).to.equal(asset.deltaAtPrice(p1));
    expect(asset.currentGrowth()).to.equal(asset.growthAtPrice(p1));
    expect(asset.duration()).gt(0);
  });

});
