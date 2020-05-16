const fs = require('fs');
const uuid = require('uuid');
const jsUtils = require('js-utils');

const StockerLib = require('../../build/Release/stockerlib').StockerLib;
const config = require('../config-file.js').load('/converter.conf');

const format = {
    "mts": {
        "extension": "mts",
        "format": "mpegts"
    },
    "dvd": {
        "extension": "mpeg",
        "format": "dvd"
    },
    "mp4": {
        "extension": "mp4",
        "format": "mp4"
    },
    "webm": {
        "extension": "webm",
        "format": "webm"
    },
    "ogv": {
        "extension": "ogv",
        "format": "ogg"
    }
};

function getFirstSourceName(params, source) {
//    if (isMultipleChoice(params) === true && params.multi_editmode === "combine") {
//        return jsUtils.file.getNameFromPath(source.replace(/^concat:(.*?)\|.*?$/, '$1'));
//    } else {
        return jsUtils.file.getNameFromPath(source);
//    }
}

function makeOutputName(source, params, pass ,ssIndex) {
    let ret = "";

    if (params.set_position === "true") {
        ret += params['ss' + ssIndex].replace(/[:\.]/g, '');  // eslint-disable-line no-useless-escape
        ret += "_";
    }

    if (params.pass2 === "true") {
        ret += pass + "pass_";
    }

    const name = getFirstSourceName(params, source);
    ret += name.filename + '.' + format[params.format].extension;

    return ret;
}

function setPassOption(params, pass, dest) {
    if (params.pass2 === 'true') {
        const passlogFile = dest + '/passlog.dat';
        return ['-pass', String(pass), '-passlogfile', passlogFile];
    }

    return [];
}

function setExtraOption(options, extraString) {
    if (!extraString) {
        return;
    }

    const extOpts = extraString.split(' ');
    if (extOpts) {
        extOpts.forEach(ext => {
            options.push(ext);
        });
    }
}

function setVideoFilter(options, params) {
    const filters = new Array();

    if (params.deinterlace === "true") {
        filters.push("yadif=0:-1");
    }

    if (params.deshake === "true") {
        /*
        const analyzeResult = output + '/stabilize.trf';
        if (pass === 1) {
            filters.push("vidstabdetect=shakiness=10:accuracy=15:result=\"${analyze_result}\"");
        } else if (pass === 2) {
            filter.push("vidstabtransform=zoom=5:input=\"${analyze_result}\"");
        }
        */
    }

    if (params.enable_crop === "true") {
        filters.push("crop=" + params.crop_w + ":" + params.crop_h + ":" + params.crop_x + ":" + params.crop_y);
    }

    if (params.enable_pad === "true") {
        filters.push("pad=" + params.pad_w + ":" + params.pad_h + ":" + params.pad_x + ":" + params.pad_y + ":" + params.pad_color);
    }

    if (params.enable_adjust === "true") {
        const eq = "eq=gamma=" + params.gamma + ":contrast=" + params.contrast + ":brightness=" + params.brightness + ":gamma_r=" + params.rg + ":gamma_g=" + params.gg + ":gamma_b=" + params.bg + ":gamma_weight=" + params.weight;
        const hue = "hue=h=" + params.hue + ":s=" + params.saturation;
        const unsharp = "unsharp=3:3:" + params.sharp;

        filters.push(eq);
        filters.push(hue);
        filters.push(unsharp);
    }

    filters.push("scale=" + params.s_w + ":" + params.s_h);  // 解像度

    if (params.aspect_set !== 'none') {
        filters.push(params.aspect_set + '=ratio=' + params.aspect_numerator + '/' + params.aspect_denominator + ':max=1000');
    }

    if (filters.length > 0) {
        let filterOpt = "";
        for (let i=0; i<filters.length; i++) {
            filterOpt += i === 0 ? '' : ',';
            filterOpt += filters[i];
        }

        options.push('-vf');
        options.push(filterOpt);
    }
}

function setVideoOption(params) {
    const ret = new Array();

    if (params.v_convert === 'none') {
        ret.push('-vn');
    } else {
        ret.push('-map');
        ret.push('0:' + params.v_map);
        ret.push('-c:v');

        if (params.v_convert === 'copy') {
            ret.push('copy');
        } else {
            ret.push(params.v_codec);

            if (params.encode_type === 'crf') {
                ret.push('-crf');
                ret.push(params.crf);
                ret.push('-preset');
                ret.push(params.preset);
            } else {
                // bitrate
                ret.push('-b:v');
                ret.push(params.b + 'k');
            }
            ret.push('-r');
            ret.push(params.r);

            setVideoFilter(ret, params);
            setExtraOption(ret, params.v_option);
        }
    }

    return ret;
}

function isLossLessCodec(codec) {
    return /(flac)|(^pcm_)/.test(codec);
}

function setAudioFilter(options, params) {
    const filters = new Array();

    if (params.volume && params.volume !== '1.0') {
        filters.push('volume=' + params.volume);
    }

    if (filters.length > 0) {
        let filterOpt = "";
        for (let i=0; i<filters.length; i++) {
            filterOpt += i === 0 ? '' : ',';
            filterOpt += filters[i];
        }

        options.push('-af');
        options.push(filterOpt);
    }
}

function setAudioOption(params) {
    const ret = new Array();

    if (params.a_convert === 'none') {
        ret.push('-an');
    } else {
        ret.push('-map');
        ret.push('0:' + params.a_map);
        ret.push('-c:a');

        if (params.a_convert === 'copy') {
            ret.push('copy');
        } else {
            ret.push(params.a_codec);

            ret.push('-ac');
            ret.push(params.ac);
            if (params.ar) {
                ret.push('-ar');
                ret.push(params.ar);
            }

            if (!isLossLessCodec(params.a_codec)) {
                ret.push('-b:a');
                ret.push(params.ab + 'k');
            }

            if (params.cutoff && params.cutoff !== '0') {
                ret.push('-cutoff');
                ret.push(params.cutoff);
            }

            setAudioFilter(ret, params);
            setExtraOption(ret, params.a_option);
        }
    }

    return ret;
}

function converterCommand(cmdgroup, options, params, output) {
    let opt = options;
    opt = opt.concat(setVideoOption(params));
    opt = opt.concat(setAudioOption(params));
    opt.push('-f');
    opt.push(format[params.format].format);
    opt.push(output);

    opt.push('</dev/null');
    opt.push('2>' + output + '.output.txt');

    return {
        cmdgroup: cmdgroup,
        command: config.ffmpeg_cmd,
        options: JSON.stringify(opt),
        queue: (params.v_convert === 'copy') ? 1 : 0
    };
}

function composeEncodeCommand(cmdgroup, source, dest, params) {
    let ssIndex = 0;
    const ret = new Array();

    do {
        const options = new Array();

        if (params.set_position === "true") {
            options.push('-ss');
            options.push(params['ss' + ssIndex]);
        }
        if (params.multi_editmode === 'combine') {
            options.push('-f');
            options.push('concat');
            options.push('-safe');
            options.push('0');
        }
        options.push('-i');
        options.push(source);
        options.push('-y');

        if (config.encoding_thread) {
            options.push('-threads');
            options.push(config.encoding_thread);
        }

        if (params.set_position === "true") {
            options.push('-t');
            options.push(params['t' + ssIndex]);
        }

        // 1pass encoding
        const pass1Options = options.concat(setPassOption(params, 1, dest));
        ret.push(converterCommand(cmdgroup, pass1Options, params,
            dest + '/' + makeOutputName(source, params, 1, ssIndex))
        );

        // 2pass encoding
        if (params.pass2 === "true") {
            const pass2Options = options.concat(setPassOption(params, 2, dest));
            ret.push(converterCommand(cmdgroup, pass2Options, params,
                dest + '/' + makeOutputName(source, params, 2, ssIndex))
            );
        }

        ssIndex++;
    } while(params['ss' + ssIndex]);

    return ret;
}

function isMultipleChoice(params) {
    return (Array.isArray(params.path) && params.path.length > 1) ? true : false;
}

function getSourcePath(stockerLib, params) {
    const path = Array.isArray(params.path) ? params.path : [params.path];

    const decoded = new Array();
    path.forEach(p => {
        decoded.push(stockerLib.decodeUrlPath(params.root, p));
    });
    decoded.sort();

    if (params.multi_editmode === 'combine') {
        const listFile = '/tmp/' + jsUtils.file.getNameFromPath(decoded[0]).filename + '.txt';
        let data = "";
        decoded.forEach(file => {
            data += 'file \'' + file + '\'\n';
        });

        fs.writeFileSync(listFile, data, {encoding: 'utf8', flag: 'w'});
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

module.exports = function(params) {
    const stockerLib = new StockerLib();

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
                options: "['-p', '" +  dest.converting + "']",
                queue: 0
            });

            ret = ret.concat(composeEncodeCommand(cmdgroup, source, dest.converting, params));

            if (params.multi_editmode === 'combine') {
                ret.push({
                    cmdgroup: cmdgroup,
                    command: "/usr/bin/rm",
                    options: "['-f', '" + source + "']",
                    queue: 0
                });
            }

            // rename temporary to destination file
            ret.push({
                cmdgroup: cmdgroup,
                command: "/usr/bin/mv",
                options: "['" + dest.converting + "', '" + dest.done + "']",
                queue: 0
            });
        });

        resolve(ret);
    });
};
