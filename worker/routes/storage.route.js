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

function getProperties(root, path) {
    let elements = new Array();
    const decodedPath = stockerLib.decodeUrlPath(root, path);
    const fname = jsUtils.file.getNameFromPath(decodedPath);
    const properties = {
        name: fname.basename,
        up_path: stockerLib.encodeUrlPath(fname.dirname),
        up_dir: fname.dirname
    };

    fs.readdirSync(decodedPath, { withFileTypes: true }).forEach((entry, index) => {
        const childPath = decodedPath + '/' + entry.name;
        elements.push(Object.assign({
            name: entry.name,
            path: stockerLib.encodeUrlPath(childPath),
            type: getType(entry),
            num: index
        }, getStats(childPath)));
    });

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
            res.json(getProperties(req.params.root, req.params.path));
        } catch (e) {
            logger.warn(e);
            res.sendStatus(404);
        }
    });
};
