import { Logger } from "../src/utils/logger"
import "mocha";
const sinon = require("sinon");
const assert = require("assert");
function mockDebugFactory(){
    const logSpy = sinon.spy();
    const mock = function (category:string){
        return function(message:string){
            logSpy(`${category} ${message}`);
        };
    };
    return [mock, logSpy];
}

describe("logger functionality", () => {
    it("should breath", () => {
        const [mock, spy] = mockDebugFactory();
        const logger:Logger = new Logger(mock, "foo", "bar" );
    });

    it ("should use parent if supplied", function(){
        const [mock, spy] = mockDebugFactory();
        const logger:Logger = new Logger(mock, "foo");
        logger.info("message in a bottle");
        assert(spy.calledWith("foo message in a bottle"));
    });

    it ("should use override label if supplied", function(){
        const [mock, spy] = mockDebugFactory();
        const logger:Logger = new Logger(mock, undefined, "bar");
        logger.info("message in a bottle");
        assert(spy.calledWith("bar message in a bottle"));
    });

    it ("should use override label if both are supplied", function(){
        const [mock, spy] = mockDebugFactory();
        const logger:Logger = new Logger(mock, "foo", "bar");
        logger.info("message in a bottle");
        assert(spy.calledWith("bar message in a bottle"));
    });

    it ("should throw if neither are supplied", function(){
        const [mock, spy] = mockDebugFactory();
        assert.throws(function(){
            const logger:Logger = new Logger(mock);
        });
    });

    it ("should postfix errors with ERROR", function(){
        const [mock, spy] = mockDebugFactory();
        const logger:Logger = new Logger(mock, "foo", "bar");
        logger.error("message in a bottle");
        assert(spy.calledWith("bar:ERROR message in a bottle"));
    });

    it ("should postfix fatals with [error], then throw", function(){
        const [mock, spy] = mockDebugFactory();
        const logger:Logger = new Logger(mock, "foo", "bar");
        assert.throws(function(){
            logger.fatal("message in a bottle");
        });
        assert(spy.calledWith("bar:ERROR message in a bottle"));
    });

});