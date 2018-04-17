import { Scenario } from "../src/models/types"
import "mocha";
const sinon = require("sinon");
const assert = require("assert");

describe("logger functionality", () => {
    it("should given numbers for start/end a scenario should assume they are timestamps", () => {
        const json = {
            id: "foo",
            start: 1,
            end: 2
        };
        Scenario.createWithObject(json, true);

        assert(Scenario.getInstance().start === 1);
        assert(Scenario.getInstance().end === 2);
        assert(Scenario.getInstance().id === "foo");

    }),
    it("should give strings for start/end attempt to parse the strings as dates with chrono", function(){
        const json = {
            id: "foo",
            start: "december 23rd 1975 7am",
            end: "may 15rd 1977 9am",
        }

        Scenario.createWithObject(json, true);
        assert(Scenario.getInstance().start === 188568000000);
        assert(Scenario.getInstance().end === 232549200000);
    });
    it ("should throw if it can't interpret what the start is", function(){
        const json = {
            id: "foo",
            start: "I would very much like to partake in lunch",
            end: "may 15th 1977 9am"
        };
        assert.throws(function(){
            Scenario.createWithObject(json, true);
        });
    });
    it ("should throw if it can't interpret what the start is", function(){
        const json = {
            id: "foo",
            start: "december 23 1975 2am",
            end: "two men enter, one man leaves"
        };
        assert.throws(function(){
            Scenario.createWithObject(json, true);
        });
    })
});