describe('stockerlib', () => {
    let stockerLib;

    beforeEach(() => {
        const StockerLib = require('../../build/Release/stockerlib').StockerLib;
        stockerLib = new StockerLib();
    });

    describe('decodeUrlPath()', () => {
        test("parameter decode", () => {
            expect(stockerLib.decodeUrlPath("cache", "/YmI/5pel5pys6Kqe44OH44Kj44Os44Kv44OI44Oq")).toBe("/path/to/cache/bb/日本語ディレクトリ");
        });
    });

    describe('encodeUrlPath()', () => {
        test("parameter encode", () => {
            expect(stockerLib.encodeUrlPath("/bb/日本語ディレクトリ")).toBe("/YmI/5pel5pys6Kqe44OH44Kj44Os44Kv44OI44Oq");
        });
    });
});
