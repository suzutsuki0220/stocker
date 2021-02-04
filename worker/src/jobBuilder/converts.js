const fs = require('fs');
const os = require('os');
const path = require('path');
const uuid = require('uuid');
const jsUtils = require('js-utils');

const StockerLib = require('../../build/Release/stockerlib').StockerLib;
const stockerConf = require('../config-file.js').load('/stocker.conf');

const FFmpegOption = require('../ffmpeg-option.js');
let ffmpegOption;

function getFirstSourceName(params, source) {
    //    if (isMultipleChoice(params) === true && params.multi_editmode === "combine") {
    //        return jsUtils.file.getNameFromPath(source.replace(/^concat:(.*?)\|.*?$/, '$1'));
    //    } else {
    return jsUtils.file.getNameFromPath(source);
    //    }
}

function makeOutputPath(source, dest, params, pass, ssIndex) {
    let ret = "";

    if (params.set_position === "true") {
        ret += params['ss' + ssIndex].replace(/[:\.]/g, '');  // eslint-disable-line no-useless-escape
        ret += "_";
    }

    if (params.pass2 === "true") {
        ret += pass + "pass_";
    }

    const name = getFirstSourceName(params, source);
    ret += name.filename + '.' + FFmpegOption.getExtension(params.format);

    return dest + '/' + ret;
}

function setPassOption(params, pass, dest) {
    if (params.pass2 === 'true') {
        const passlogFile = dest + '/passlog.dat';
        return ['-pass', String(pass), '-passlogfile', passlogFile];
    }

    return [];
}

function composeConvertCommand(cmdgroup, source, dest, params) {
    let ssIndex = 0;
    const ret = new Array();

    do {
        // 1pass encoding
        ret.push({
            cmdgroup: cmdgroup,
            command: stockerConf.ffmpeg_cmd,
            options: ffmpegOption.compose(source, makeOutputPath(source, dest, params, 1, ssIndex), params, ssIndex, setPassOption(params, 1, dest)),
            queue: (params.v_convert === 'copy') ? 1 : 0
        });

        // 2pass encoding
        if (params.pass2 === "true") {
            ret.push({
                cmdgroup: cmdgroup,
                command: stockerConf.ffmpeg_cmd,
                options: ffmpegOption.compose(source, makeOutputPath(source, dest, params, 2, ssIndex), params, ssIndex, setPassOption(params, 2, dest)),
                queue: (params.v_convert === 'copy') ? 1 : 0
            });
        }

        ssIndex++;
    } while (params['ss' + ssIndex]);

    return ret;
}

function isMultipleChoice(params) {
    return (Array.isArray(params.path) && params.path.length > 1) ? true : false;
}

function getSourcePath(stockerLib, params) {
    const pathArray = Array.isArray(params.path) ? params.path : [params.path];

    const decoded = new Array();
    pathArray.forEach(p => {
        decoded.push(stockerLib.decodeUrlPath(params.root, p));
    });
    decoded.sort();

    if (params.multi_editmode === 'combine') {
        const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'stockerWorker-'));
        const listFile = path.join(tmpDir, jsUtils.file.getNameFromPath(decoded[0]).filename + '.txt');
        let data = "";
        decoded.forEach(file => {
            data += 'file \'' + file + '\'\n';
        });

        fs.writeFileSync(listFile, data, { encoding: 'utf8', flag: 'w' });
        return [listFile];
    }

    return decoded;
}

function destinationPath(stockerLib, params, source) {
    const destBase = stockerLib.decodeUrlPath(params.out_root, params.out_path);
    const name = getFirstSourceName(params, source);
    return {
        converting: destBase + '/__CONVERTING__' + name.filename,
        done: destBase + '/' + name.filename
    };
}

module.exports = function (params) {
    const stockerLib = new StockerLib();
    ffmpegOption = new FFmpegOption({ encodingThread: stockerConf.encoding_thread });

    return new Promise((resolve, reject) => {
        if (!params.root || !params.path) {
            reject(new Error("parameter NG"));
        }

        const sourcePath = getSourcePath(stockerLib, params);

        let ret = new Array();
        const cmdgroup = uuid.v4();

        sourcePath.forEach(source => {
            const dest = destinationPath(stockerLib, params, source);

            // 出力先のディレクトリを作る
            ret.push({
                cmdgroup: cmdgroup,
                command: "/usr/bin/mkdir",
                options: ['-p', dest.converting],
                queue: 0
            });

            ret = ret.concat(composeConvertCommand(cmdgroup, source, dest.converting, params));

            if (params.multi_editmode === 'combine') {
                const tmpDir = jsUtils.file.getNameFromPath(source).dirname;
                ret.push({
                    cmdgroup: cmdgroup,
                    command: "/usr/bin/rm",
                    options: ['-rf', tmpDir],
                    queue: 0
                });
            }

            // rename temporary to destination file
            ret.push({
                cmdgroup: cmdgroup,
                command: "/usr/bin/mv",
                options: [dest.converting, dest.done],
                queue: 0
            });
        });

        resolve(ret);
    });
};
