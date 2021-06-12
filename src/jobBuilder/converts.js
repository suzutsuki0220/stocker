const fs = require('fs');
const os = require('os');
const path = require('path');
const uuid = require('uuid');
const jsUtils = require('js-utils');

const StockerLib = require('../../build/Release/stockerlib').StockerLib;
const stockerConf = require('../../config/stocker-conf.json');

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

// 複数のファイルを結合するにはパスを書き出したファイルをffmpegに渡す
function makeCombineListfile(files) {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'stockerWorker-'));
    const listFile = path.join(tmpDir, jsUtils.file.getNameFromPath(files[0]).filename + '.txt');
    let data = "";
    files.forEach(file => {
        data += 'file \'' + file + '\'\n';
    });

    fs.writeFileSync(listFile, data, { encoding: 'utf8', flag: 'w' });

    return listFile;
}

function composeConvertCommand(cmdgroup, source, dest, params) {
    let ssIndex = 0;
    const ret = new Array();
    const outputs = new Array();

    do {
        if (params.set_position === 'true' && params.after_combine_them === 'true') {
            outputs.push(makeOutputPath(source, dest, params, params.pass2 === "true" ? 1 : 2, ssIndex));
        }

        // 1pass encoding
        ret.push({
            cmdgroup: cmdgroup,
            command: stockerConf.commands.ffmpeg,
            options: ffmpegOption.compose(source, makeOutputPath(source, dest, params, 1, ssIndex), params, ssIndex, setPassOption(params, 1, dest)),
            queue: (params.v_convert === 'copy') ? 1 : 0
        });

        // 2pass encoding
        if (params.pass2 === "true") {
            ret.push({
                cmdgroup: cmdgroup,
                command: stockerConf.commands.ffmpeg,
                options: ffmpegOption.compose(source, makeOutputPath(source, dest, params, 2, ssIndex), params, ssIndex, setPassOption(params, 2, dest)),
                queue: (params.v_convert === 'copy') ? 1 : 0
            });
        }

        ssIndex++;
    } while (params['ss' + ssIndex]);

    if (outputs.length > 1) {
        const listFile = makeCombineListfile(outputs);
        const concatOutput = dest + '/concat_' + jsUtils.file.getNameFromPath(outputs[0]).filename + '.' + FFmpegOption.getExtension(params.format);
        const concatParams = {
            ...params,
            set_position: false,
            multi_editmode: 'combine',
            v_convert: 'copy',
            v_map: '',
            frames: '',
            a_convert: 'copy',
            a_map: ''
        };
        ret.push({
            cmdgroup: cmdgroup,
            command: stockerConf.commands.ffmpeg,
            options: ffmpegOption.compose(listFile, concatOutput, concatParams),
            queue: (params.v_convert === 'copy') ? 1 : 0
        });

        const tmpDir = jsUtils.file.getNameFromPath(listFile).dirname;
        ret.push({
            cmdgroup: cmdgroup,
            command: "/usr/bin/rm",
            options: ['-rf', tmpDir],
            queue: (params.v_convert === 'copy') ? 1 : 0
        });
    }

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
        return [makeCombineListfile(decoded)];
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
    ffmpegOption = new FFmpegOption({ encodingThread: stockerConf.encodingThreads });

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
                queue: (params.v_convert === 'copy') ? 1 : 0
            });

            ret = ret.concat(composeConvertCommand(cmdgroup, source, dest.converting, params));

            if (params.multi_editmode === 'combine') {
                const tmpDir = jsUtils.file.getNameFromPath(source).dirname;
                ret.push({
                    cmdgroup: cmdgroup,
                    command: "/usr/bin/rm",
                    options: ['-rf', tmpDir],
                    queue: (params.v_convert === 'copy') ? 1 : 0
                });
            }

            // rename temporary to destination file
            ret.push({
                cmdgroup: cmdgroup,
                command: "/usr/bin/mv",
                options: [dest.converting, dest.done],
                queue: (params.v_convert === 'copy') ? 1 : 0
            });
        });

        resolve(ret);
    });
};
