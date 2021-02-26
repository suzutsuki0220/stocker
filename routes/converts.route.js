const jobDb = require('../src/jobdb.js');
const jobBuilder = require('../src/jobBuilder');
const stockerConf = require('../config/stocker-conf.json');

function addCorsHeader(res) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, Content-Type, Accept, Authorization, access_token");
}

module.exports = function (app) {
    const apiRest = stockerConf.htdocsRoot + '/api/v1/converts';

    // create
    app.post(apiRest, function (req, res) {
        addCorsHeader(res);

        jobBuilder.converts(req.body).then(jobs => {
            jobDb.create(jobs);
            res.json({ message: "encode job create successfully" });
        }).catch(error => {
            res.status(500).json(error.message);
        });
    });

    // read
    app.get(apiRest + '/:id', function (req, res) {
        addCorsHeader(res);
        jobDb.get(
            function (data) {
                res.json(data || {});
            }, req.params.id
        );
    });

    // update
    app.patch(apiRest + '/:id', function (req, res) {
        addCorsHeader(res);
        res.status(500).json({ error: 'messge' });
    });

    // delete
    app.delete(apiRest + '/:id', function (req, res) {
        addCorsHeader(res);
        res.status(500).json({ error: 'messge' });
    });
};
