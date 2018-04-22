import { TradeLogger } from "../src/utils/trade-logger"
import "mocha";
const assert = require("assert");

describe("logger functionality", () => {
    it("should call readable if exposed, otherwise seiralize, otherwise as is", () => {
        const thing = { "foo": "foo"};
        const stuff = [
            {
                readable: () => { return thing; }
            },
            thing,
            "foo"
        ];
        const result = TradeLogger.convertReadables(stuff);
        assert.equal(result[0], JSON.stringify(thing, null,"\t"));
        assert.equal(result[1], JSON.stringify(thing, null, "\t"));
        assert.equal(result[2], "foo");

    });


});