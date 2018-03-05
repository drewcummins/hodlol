# hodlol
Algo trading platform for cryptocurrencies


### Getting Setup
1. Clone the repo.
1. [Verify the commit you've checked out](#full-paranoia-verification) (optional).
1. Run `npm install`.
1. Setup your binance API key/secret by duplicating `env/dev.example.env` to `env/dev.env` and filling in appropriately.
1. Run `npm run test-dev`. If all the tests pass, you should be good!
1. If you'd like to test order creation against Binance, set `TEST_LIVE=1` on your environment and rerun `npm run test-dev`


### Conceptual Model
The whole of hodlol is modeled around the idea of a _trader_. A trader implements any number of _strategies_ on a given exchange. A trader is described by a `.trader` JSON file. There's an extremely prudent, hard-to-beat trader named _dummy_ in the `traders` directory:

```javascript
{
  "name": "dummy",
  "exchange": "binance",
  "strategies": [
    {
      "fileName": "hodl",
      "className": "HODL",
      "weight": 1
    }
  ],
  "tickers": [
    "ETH/BTC", "BTC/USDT"
  ]
}
```

This trader implements a hold strategy on Binance. The `tickers` indicate which markets to follow. Hodlol pulls all the data you want to track in the background and gives you the most recent data as it becomes available.

Now this is obviously a pretty uninteresting trader. Let's look at a slightly more involved trader:

```javascript
{
  "name": "obv-macd-lite",
  "exchange": "binance",
  "strategies": [
    {
      "fileName": "index",
      "className": "Strategy",
      "title": "Any--MACD,OBV",
      "weight": 1,
      "indicators": [
        {
          "fileName": "any", 
          "className": "Any",
          "subsignals": [
            { "fileName": "macd", "className": "MACD" },
            { "fileName": "obv", "className": "OBV" }
          ]
        }
      ]
    },
    {
      "fileName": "index",
      "className": "Strategy",
      "title": "All--MACD,OBV",
      "weight": 1,
      "indicators": [
        {
          "fileName": "all", 
          "className": "All",
          "subsignals": [
            { "fileName": "macd", "className": "MACD" },
            { "fileName": "obv", "className": "OBV" }
          ]
        }
      ]
    },
    {
      "fileName": "hodl",
      "className": "HODL",
      "weight":1
    }
  ],
  "tickers": [
    "ETH/BTC", "BTC/USDT"
  ]
}

```

The only thing that changes between this and the hodl strategy is the name and inclusion of 2 _additional_ strategies. Let's look at one of them:

```javascript
{
  "fileName": "index",
  "className": "Strategy",
  "title": "Any--MACD,OBV",
  "weight": 1,
  "indicators": [
    {
      "fileName": "any", 
      "className": "Any",
      "subsignals": [
        { "fileName": "macd", "className": "MACD" },
        { "fileName": "obv", "className": "OBV" }
      ]
    }
  ]
}
```

So the first 2 lines are the file and class name properties. These are hopefully self-explanatory as the whole idea is to make writing new strategies quick and easy. The `fileName` tells where _in the strategy directory_ the file is located. The `className` indicates the name of the `Strategy` or `Strategy` subclass.

After that, we give it a title which just helps us identify it as we test.

The next bit is `weight`. You can think of this parameter as describing parts in a strategy cocktail--in this case each strategy will get to handle one third the total funds allocated to the trader since there are 3 of them each staking one part.

Whenever a new tick gets pulled in, or an order status changes, each strategy will automatically have its `tick` method called. By default, a strategy will then call `tick` on all its signals. Signals emit buy/hold/sell signals according to the current price data. If a strategy chooses to react to a buy or sell signal, it requests that the trader places an order. The default trader will do this provided sufficient funds exist.

So here we actually have a not-entirely-trivial strategy in that it listens for an `Any` signal which itself propagates a `MACD` or `OBV` signal when either are triggered. You can read about MACD [here](https://www.tradingview.com/wiki/MACD_(Moving_Average_Convergence/Divergence)) and OBV [here](https://www.tradingview.com/wiki/MACD_(Moving_Average_Convergence/Divergence)).

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
