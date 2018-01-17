'use strict';

module.exports.buildBaseQuoteSymbolMap = (markets) => {
  let map = {};
  for (const symbol in markets) {
    if (markets.hasOwnProperty(symbol)) {
      const market = markets[symbol];
      if (!market.darkpool) {
        // not sure what this is
        map[`${market.base}-${market.quote}`] = symbol;
      }
    }
  }
  map.getMarket = (base, quote) => {
    const symbol = map[`${base}-${quote}`];
    return markets[symbol];
  }
  return map;
};
