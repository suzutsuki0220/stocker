describe('jobBuilder/converts', () => {
    let jobBuilder;

    beforeEach(() => {
        jobBuilder = require('../../src/jobBuilder');
    });

    describe('converts', () => {
        test('single movie', () => {
            const params = {
                root: 'cache',
                path: '/YmI/5pel5pys6Kqe44OH44Kj44Os44Kv44OI44Oq/5paw44GX44GE5YuV55S7Lm1wNA'
            };

            jobBuilder.converts(params).then(job => {
                expect(job[0].command).toBe('/usr/bin/mkdir');
                expect(job[0].options).toBe("['-p', '/path/to/cache/bb/日本語ディレクトリ/新しい動画']");
                expect(job[0].queue).toBe(0);
            });
        });
    });
});
