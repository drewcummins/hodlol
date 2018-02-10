'use strict'

module.exports.newtonRaphson = (x, f, df, maxTries=100) => {
  while (Math.abs(f(x)) > Number.EPSILON && --maxTries > 0) {
    x -= f(x)/df(x);
  }
  return x;
}
