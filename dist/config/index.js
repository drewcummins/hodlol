"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const types_1 = require("../models/types");
if (!process.env.NODE_ENV)
    process.env.NODE_ENV = "dev";
require('dotenv').config({ path: `./env/${process.env.NODE_ENV}.env` });
exports.config = {
    binance: {
        apiKey: process.env.BINANCE_API_KEY,
        secret: process.env.BINANCE_API_SECRET
    },
    state: new types_1.BitfieldState()
};
//# sourceMappingURL=index.js.map