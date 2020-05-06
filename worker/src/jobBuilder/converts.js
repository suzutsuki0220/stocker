const uuid = require('uuid');
const jsUtils = require('js-utils');

const StockerLib = require('../../build/Release/stockerlib').StockerLib;
const config = require('../config-file.js').load('/converter.conf');

function makeOutputDirectory(outputPath, sourcePath) {

}

function composeOptions(params) {

}

function makeOutputName(params) {

}

function isMultipleChoice(params) {
    return (Array.isArray(params.path) && params.path.length > 1) ? true : false;
}

function getSourcePath(stockerLib, params) {
    const path = Array.isArray(params.path) ?  params.path : [params.path];

    let ret = new Array();
    path.forEach(p => {
        ret.push(stockerLib.decodeUrlPath(params.root, p));
    });

    return ret;
}

function destinationPath(stockerLib, params, source) {
    const destBase = stockerLib.decodeUrlPath(params.out_root, params.out_path);
    const name = jsUtils.file.getNameFromPath(source);

    return destBase + '/' + name.filename;
}

module.exports = function(params) {
    const stockerLib = new StockerLib();

    return new Promise((resolve, reject) => {
        if (!params.root || !params.path) {
            reject(new Error("parameter NG"));
        }

        const sourcePath = getSourcePath(stockerLib, params);

        const ret = new Array();
        const cmdgroup = uuid.v4();

        sourcePath.forEach(source => {
            const dest = destinationPath(stockerLib, params.root, source);

            // 出力先のディレクトリを作る
            ret.push({
                cmdgroup: cmdgroup,
                command: "/usr/bin/mkdir",
                options: "['-p', '" +  dest + "']",
                queue: 0
            });

            // 1pass encoding

            // 2pass encoding

            // rename temporary to destination file
            ret.push({
                cmdgroup: cmdgroup,
                command: "/usr/bin/mv",
                options: "['--help']",
                queue: 0
            });
        });

        resolve(ret);
    });
};
