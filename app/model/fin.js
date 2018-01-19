'use strict'

const uuid = require('uuid/v4');



class Price {
  constructor(price, timestamp) {
    this.x = price;
    this.t = timestamp;
  }
  static priceFromTicker(ticker) {
    return new Price(ticker.ask, ticker.timestamp);
  }
}



class Pair {
  constructor(base, quote, ticker=null) {
    this.base = base;
    this.quote = quote;
    this.prices = [];
    if (ticker) {
      this.push(Price.priceFromTicker(ticker));
    }
  }
  symbol() {
    return `${this.base}-${this.quote}`;
  }
  push(price) {
    this.prices.push(price);
  }
  currentPrice() {
    return this.prices[this.prices.length - 1];
  }
}



class Asset {
  constructor(pair, amount) {
    this.id = uuid();
    this.pair = pair;
    this.symbol = pair.symbol();
    this.paid = pair.currentPrice();
    this.amount = amount;
    this.portfolioID = null; // just to be explicit
    this.pending = false;
    this.pendingOrderID = null;
  }
  initialValue() {
    return this.paid.x * this.amount;
  }
  currentValue() {
    const current = this.pair.currentPrice();
    return current.x * this.amount;
  }
  currentDelta() {
    const current = this.pair.currentPrice();
    return current.x - this.paid.x;
  }
  currentGrowth() {
    const current = this.pair.currentPrice();
    return current.x/this.paid.x;
  }
  valueAtPrice(price) {
    return price.x * this.amount;
  }
  deltaAtPrice(price) {
    return price.x - this.paid.x;
  }
  growthAtPrice(price) {
    return price.x/this.paid.x;
  }
  duration() {
    return + new Date() - this.paid.t;
  }
}



class Portfolio {
  constructor() {
    this.id = uuid();
    this.assets = {};
  }

  addAsset(asset) {
    if (asset.portfolioID != null) {
      throw new Error("Asset already belongs to portfolio", portfolio.id);
    }
    asset.portfolioID = this.id;

    let quote = this.assets[asset.pair.quote];
    if (!quote) {
      quote = this.assets[asset.pair.quote] = {};
    }

    let base = quote[asset.pair.base];
    if (!base) {
      base = quote[asset.pair.base] = {};
    }

    base[asset.id] = asset;
  }

  removeAsset(asset) {
    let quote = this.assets[asset.pair.quote];
    if (quote) {
      let base = quote[asset.pair.base];
      if (base && base[asset.id]) {
        base[asset.id].portfolioID = null;
        delete base[asset.id];
        return true;
      }
    }
    return false;
  }

  assetList() {
    let all = [];
    for (var quote in this.assets) {
      if (this.assets.hasOwnProperty(quote)) {
        let q = this.assets[quote];
        for (var base in q) {
          if (q.hasOwnProperty(base)) {
            let b = q[base];
            for (var assetID in b) {
              if (b.hasOwnProperty(assetID)) {
                all.push(b[assetID]);
              }
            }
          }
        }
      }
    }
    return all;
  }

  assetHash() {
    let all = {};
    for (var quote in this.assets) {
      if (this.assets.hasOwnProperty(quote)) {
        if (!all[quote]) {
          all[quote] = [];
        }
        let q = this.assets[quote];
        for (var base in q) {
          if (q.hasOwnProperty(base)) {
            let b = q[base];
            for (var assetID in b) {
              if (b.hasOwnProperty(assetID)) {
                all[quote].push(b[assetID]);
              }
            }
          }
        }
      }
    }
    return all;
  }

  reduce(lambda, init=0) {
    const all = this.assetHash();
    let out = {};
    for (var quote in all) {
      if (all.hasOwnProperty(quote)) {
        out[quote] = all[quote].reduce(lambda, init);
      }
    }
    return out;
  }

  initialValue() {
    return this.reduce((mem, asset) => mem + asset.initialValue());
  }

  currentValue() {
    return this.reduce((mem, asset) => mem + asset.currentValue());
  }

  currentGrowth() {
    const init = this.initialValue();
    const curr = this.currentValue();
    let growth = {};
    for (var quote in curr) {
      growth[quote] = curr[quote] / init[quote];
    }
    return growth;
  }

  numAssets() {
    return this.assetList().length;
  }
}


module.exports = {
  Price: Price,
  Pair: Pair,
  Asset: Asset,
  Portfolio: Portfolio
}
