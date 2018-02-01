# hodlol
Algo trading platform for cryptocurrencies


### Getting Setup
1. Clone the repo.
1. [Verify the commit you've checked out](#full-paranoia-verification) (optional).
1. Run `npm install`.
1. Setup your binance API key/secret by duplicating `env/dev.example.env` to `env/dev.env` and filling in appropriately.
1. Run `npm run test-dev`. If all the tests pass, you should be good.


### Conceptual Model
The whole of hodlol is modeled around the idea of a _trader_. A trader implements any number of _strategies_ on the exchange of his choosing and is described by a `.trader` JSON file. Here's an incredibly stupid trader named `dummy` who runs 2 strategies on Binance:

```javascript
  "name": "dummy",
  "exchange": "binance",
  "strategies": [
    {
      "id": "buy-dip-sell-peak",
      "weight": 1,
      "params": {"threshold": 0.0001}
    },
    {
      "id": "hodl",
      "weight": 1
    }
  ],
  "tickers": [
    "ETH/BTC", "BTC/USDT"
  ],
  "candles": [
    "ETH/BTC", "BTC/USDT"
  ],
  "record": true
}
```

The `record` boolean indicates whether you'd like to record the ticker data (you probably do). The `tickers` and `candles` are the ticker data and open-high-low-close-volume data pairs your strategies might be concerned with. The `id` property of each strategy maps to a subclass of `Strategy` that is then dynamically loaded at initialization. You can think of the `weight` parameter as describing parts in a strategy cocktail--in this case each strategy will get to handle half the funds allocated to the trader.

Whenever a new tick, or candlestick, or order status changes, each strategy will automatically have its `tick` method called. By default, a strategy will then call `tick` on all its signals. Signals emit buy/hold/sell signals according to the current price data. If a strategy chooses to react to a buy or sell signal, it requests that the trader places an order. The default trader will do this if sufficient funds exist.

### Running A Trader
To run a trader, you simply point to your `.trader` file and indicate which and how much funds to give it access to. For instance, if you have half a Bitcoin you'd like to trade with, you'd run:

    ./index.js your-trader.trader --symbol BTC --amount 0.5

If you don't want to place actual order, you can add `--fake` or `-f` to simulate orders only.

Once you have recorded data, you may wish to run backtests against it. This is accomplished by providing a _scenario_. A scenario is defined in a `.scenario` file, which basically just points to a directory you've previously recorded tick data in. Here's what that looks like:

```javascript
{
  "start": 1517254274948,
  "end": 1517254652314,
  "date_id": "January-29-2018-2:31:13-PM"
}
```

The `date_id` tells the trader where to grab the ticker data from (this is the format created when running in regular mode). You can optionally supply a start and end timestamp. All together, backtesting looks like so:

    ./index.js your-trader.trader --symbol BTC --amount 0.5 --backtest my-backtest.scenario

It's quite likely that you'll want to just record some data. For this purpse, it's perfectly acceptable to run a trader with no strategies and `record` set to true.

### Full Paranoia Verification
Since hodlol accesses sensitive shit like your precious money, I've decided to sign all commits and tags. If there end up being more contributors, you should make sure the commit you're checking out is verified by me/someone you trust. Github puts a little "verified" flag on all such commits; you can also verify a commit locally with `git verify-commit <commit>`.

However, if you want to go full paranoid nutter, you should find my public key on a keyserver like https://pgp.mit.edu and verify that the commit you checked out is, in fact, authentic. You do this by finding `HEAD` in your `.git` directory and splitting out the signature and commit into separate files, then running `gpg --verify commit.sig commit` once you've added my public key to your keyring. This should be about as secure as you can be, assuming you trust me.
