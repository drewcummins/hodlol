var expect = require('chai').expect;
let fin = require('../app/model/fin');

const bases = ["XRB", "VEN", "DBC", "KCS"];
const quotes = ["BTC", "ETH", "NEO"];

let portfolio = new fin.Portfolio();

let pairs = [];

let t0 = + new Date();

for (var i = 0; i < bases.length; i++) {
  for (var j = 0; j < quotes.length; j++) {
    let pair = new fin.Pair(bases[i], quotes[j]);
    let price = new fin.Price(1+Math.random() * 100, t0);
    pair.push(price);
    pairs.push(pair);
  }
}

let totalValue = 0;
const numAssets = 20;
for (var i = 0; i < numAssets; i++) {
  let pair = i > 0 ? pairs[Math.floor(Math.random() * pairs.length)] : pairs[0];
  let amount = 1 + Math.random() * 1000;
  let price = pair.currentPrice();
  let asset = new fin.Asset(pair, price.x, amount, price.t);
  portfolio.addAsset(asset);
}


describe('Test initialized portfolio', function() {
  it('should show expected values', function() {
    expect(portfolio.numAssets()).to.equal(numAssets);
    // there have been no price changes since portfolio creation
    const init = portfolio.initialValue();
    const curr = portfolio.currentValue();
    for (var quote in curr) {
      expect(curr[quote]).to.equal(init[quote]);
    }
  });

  it('should reflect updated price', function() {
    let price = new fin.Price(200, + new Date());
    // add this new price to "XRB-BTC" pair
    // (we're guaranteed to have at least one such asset in the portfolio):
    pairs[0].push(price);
    // since our dummy prices were at most < 101 and this price is 200,
    // this should cause an increase in value from the initial value
    const init = portfolio.initialValue();
    const curr = portfolio.currentValue();
    expect(curr["BTC"]).to.be.gt(init["BTC"]);
    // and growth for BTC should be above 1
    let growth = portfolio.currentGrowth();
    expect(growth["BTC"]).to.be.gt(1);
  });

  it('should remove an asset', function() {
    portfolio.removeAsset(portfolio.assetList()[0]);
    expect(portfolio.numAssets()).to.equal(numAssets - 1);
  })
});
