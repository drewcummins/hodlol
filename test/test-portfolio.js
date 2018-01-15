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
for (var i = 0; i < 20; i++) {
  let pair = pairs[Math.floor(Math.random() * pairs.length)];
  let amount = 1 + Math.random() * 1000;
  let price = pair.currentPrice();
  let asset = new fin.Asset(pair, price.x, amount, price.t);
  portfolio.addAsset(asset);
}

console.log(portfolio.initialValue());
