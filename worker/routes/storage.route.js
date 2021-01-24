const fs = require('fs');
const jsUtils = require('js-utils');
const StockerLib = require('../build/Release/stockerlib').StockerLib;
const roots = require('../src/config-file.js').load('/basedirs.conf');
const logger = require('log4js').getLogger("stocker");

const stockerLib = new StockerLib();

function getStats(path) {
    const stats = fs.statSync(path);
    if (stats.isDirectory()) {
        return {
            size: fs.readdirSync(path).length,
            last_modified: stats.mtimeMs
        };
    } else {
        return {
            size: stats.size,
            last_modified: stats.mtimeMs
        };
    }
}

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
                path: stockerLib.encodeUrlPath(root, childPath),
                type: getType(entries[i]),
                num: i
            }, getStats(childPath)));
        }
    }

    return { properties: properties, elements: elements };
}

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

    app.get(apiRest + '/:root/:path(*)/properties', function (req, res) {
        try {
            res.json(getProperties(req.params.root, req.params.path, req.query));
        } catch (e) {
            console.warn(e);
            res.sendStatus(404);
        }
    });
};
