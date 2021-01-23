//const StockerLib = require('../build/Release/stockerlib').StockerLib;
const roots = require('../src/config-file.js').load('/basedirs.conf');

module.exports = function (app) {
    const apiRest = '/api/v1/storage';

    app.get(apiRest + '/root-paths', function (req, res) {
        let data = new Array();
        for (const name in roots) {
            const encoded = encodeURIComponent(name.replace(/ /g, '+'));
            data.push({ name: name, encoded: encoded });
        }

        res.json(data);
    });

    app.get(apiRest + '/:root/:path', function (req, res) {
        let data = { root: req.params.root, path: req.params.path };
        res.json(data);
    });
};
