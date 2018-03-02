import { BitfieldState } from "../models/types";

if (!process.env.NODE_ENV) process.env.NODE_ENV = "dev";

require('dotenv').config({path: `./env/${process.env.NODE_ENV}.env`});

export const config:any = {
  binance: {
    apiKey: process.env.BINANCE_API_KEY,
    secret: process.env.BINANCE_API_SECRET
  },
  state: new BitfieldState()
};