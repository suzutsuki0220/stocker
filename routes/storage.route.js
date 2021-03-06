const fs = require('fs');
const jsUtils = require('js-utils');
const StockerLib = require('../build/Release/stockerlib').StockerLib;
const roots = require('../src/config-file.js').load('/basedirs.conf');
const stockerConf = require('../config/stocker-conf.json');
const StockerStorage = require('../src/stocker-storage.js');

const stockerLib = new StockerLib();

function getType(dirent) {
    if (dirent.isDirectory()) {
        return "DIRECTORY";
    } else if (dirent.isFile()) {
        return "FILE";
    }
    return "ERROR";
}

function removeRootPath(root, path) {
    const rootPath = stockerLib.decodeUrlPath(root, '');
    if (path.indexOf(rootPath) !== 0) {
        return '';
    }

    return path.substring(rootPath.length);
}

function getProperties(root, path, query) {
    let elements = new Array();
    const decodedPath = stockerLib.decodeUrlPath(root, path);

    const fname = jsUtils.file.getNameFromPath(decodedPath);
    const properties = {
        name: path ? fname.basename : '',
        dirname: path ? removeRootPath(root, fname.dirname) : '',
        root: root,
        up_path: path ? stockerLib.encodeUrlPath(root, fname.dirname) : ''
    };

    if (fs.statSync(decodedPath).isDirectory()) {
        const entries = fs.readdirSync(decodedPath, { withFileTypes: true })
        const from = Number(query.from) || 0;
        const to = jsUtils.value.getMin(entries.length - 1, Number(query.to));

        for (let i = from; i <= to; i++) {
            const childPath = decodedPath + '/' + entries[i].name;
            elements.push(Object.assign({
                name: entries[i].name,
                root: root,
                path: stockerLib.encodeUrlPath(root, childPath),
                type: getType(entries[i]),
                num: i
            }, StockerStorage.getStats(childPath)));
        }
    }

    return { properties: properties, elements: elements };
}

module.exports = function (app, log) {
    const apiRest = stockerConf.htdocsRoot + '/api/v1/storage';

    app.get(apiRest + '/root-paths', function (req, res) {
        let data = new Array();
        for (const name in roots) {
            const encoded = encodeURIComponent(name.replace(/ /g, '+'));
            data.push({ name: name, encoded: encoded });
        }

        res.json(data);
    });

    app.get(apiRest + '/:rootAndPath(*)/properties', function (req, res) {
        try {
            const rp = StockerStorage.divideRootPath(req.params.rootAndPath);
            res.json(getProperties(rp.root, rp.path, req.query));
        } catch (e) {
            log.warn(e);
            res.sendStatus(404);
        }
    });

    app.get(apiRest + '/:root/:path(*)/raw', function (req, res) {
        try {
            const decoded = stockerLib.decodeUrlPath(req.params.root, req.params.path);
            const name = jsUtils.file.getNameFromPath(decoded);
            res.attachment(name.basename);
            res.sendFile(decoded, { dotfiles: 'deny', acceptRanges: true });
        } catch (e) {
            log.warn(e);
            res.sendStatus(404);
        }
    });

    app.delete(apiRest + '/:root/:path(*)', function (req, res) {
        StockerStorage.delete(req.params.root, req.params.path).then(() => {
            res.send('{"status": "ok", "message": "successful"}');
        }).catch((error) => {
            // frontのfetchがエラーにならないように200で返す
            res.send('{"status": "fail", "message": "' + error + '"}');
        });
    });

    app.put(apiRest + '/:rootAndPath(*)/mkdir', function (req, res) {
        StockerStorage.mkdir(req.params.rootAndPath, req.body.newname).then(() => {
            res.send('{"status": "ok", "message": "successful"}');
        }).catch((error) => {
            log.info('mkdir failed: ' + error + ' name: [' + req.body.newname + ']');
            // frontのfetchがエラーにならないように200で返す
            res.send('{"status": "fail", "message": "' + error + '"}');
        });
    });
};
