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
    },
    "mp3": {
        "extension": "mp3",
        "format": "mp3",
        "noVideo": true,
        "defaultAcodec": "libmp3lame"
    },
    "ogg": {
        "extension": "ogg",
        "format": "ogg",
        "noVideo": true,
        "defaultAcodec": "libvorbis"
    },
    "wav": {
        "extension": "wav",
        "format": "wav",
        "noVideo": true,
        "defaultAcodec": "pcm_s16le"
    },
    "jpeg": {
        "extension": "jpg",
        "format": "image2",
        "noAudio": true
    }
};

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

function composeVideoFilterOption(params) {
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

    if (params.s_w && params.s_h) {
        filters.push("scale=" + params.s_w + ":" + params.s_h);  // 解像度
    }

    if (params.aspect_set && params.aspect_set !== 'none') {
        filters.push(params.aspect_set + '=ratio=' + params.aspect_numerator + '/' + params.aspect_denominator + ':max=1000');
    }

    if (filters.length > 0) {
        let filterOpt = "";
        for (let i = 0; i < filters.length; i++) {
            filterOpt += i === 0 ? '' : ',';
            filterOpt += filters[i];
        }
        return filterOpt;
    }

    return '';
}

function setVideoOptions(params) {
    const ret = new Array();

    if (format[params.format].noVideo === true) {
        return ret;
    }

    if (params.v_convert === 'none') {
        ret.push('-vn');
    } else {
        if (params.v_map) {
            ret.push('-map');
            ret.push('0:' + params.v_map);
        }

        if (params.frames) {
            ret.push('-frames:v');
            ret.push(params.frames);
        }

        if (params.v_convert === 'copy') {
            ret.push('-c:v');
            ret.push('copy');
        } else {
            if (params.v_codec) {
                ret.push('-c:v');
                ret.push(params.v_codec);
            }

            if (params.encode_type === 'crf') {
                ret.push('-crf');
                ret.push(params.crf);
                ret.push('-preset');
                ret.push(params.preset);
            } else if (params.b) {
                // bitrate
                ret.push('-b:v');
                ret.push(params.b + 'k');
            }

            if (params.r) {
                ret.push('-r');
                ret.push(params.r);
            }

            const filterOpt = composeVideoFilterOption(params);
            if (filterOpt) {
                ret.push('-vf');
                ret.push(filterOpt);
            }
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
        for (let i = 0; i < filters.length; i++) {
            filterOpt += i === 0 ? '' : ',';
            filterOpt += filters[i];
        }

        options.push('-af');
        options.push(filterOpt);
    }
}

function setAudioOptions(params) {
    const ret = new Array();

    if (format[params.format].noAudio === true) {
        return ret;
    }

    if (params.a_convert === 'none') {
        ret.push('-an');
    } else {
        if (params.a_map) {
            ret.push('-map');
            ret.push('0:' + params.a_map);
        }

        if (params.a_convert === 'copy') {
            ret.push('-c:a');
            ret.push('copy');
        } else {
            const codec = params.a_codec || format[params.format].defaultAcodec;

            if (codec) {
                ret.push('-c:a');
                ret.push(codec);
            }

            if (params.ac) {
                ret.push('-ac');
                ret.push(params.ac);
            }
            if (params.ar) {
                ret.push('-ar');
                ret.push(params.ar);
            }

            if (params.ab && !isLossLessCodec(codec)) {
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

function setInputOptions(source, threads, params, ssIndex) {
    const options = new Array();

    if (!isNaN(ssIndex) && params.set_position === "true" && params['ss' + ssIndex]) {
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

    if (params.nolog) {
        options.push("-loglevel");
        options.push("quiet");
    }

    if (threads) {
        options.push('-threads');
        options.push(threads);
    }

    /*
    options.push('-progress');
    options.push(dest + '/_progress.txt');
    */

    if (!isNaN(ssIndex) && params.set_position === "true" && params['t' + ssIndex]) {
        options.push('-t');
        options.push(params['t' + ssIndex]);
    }

    return options;
}

module.exports = class FFmpegOption {
    constructor(options = {}) {
        this.encodingThread = options.encodingThread || ''
    }

    compose(source, output, params, ssIndex = 0, passOptions = []) {
        if (!params.format) {
            throw new Error('unable format');
        }

        return [
            ...setInputOptions(source, this.encodingThread, params, ssIndex),
            ...passOptions,
            ...setVideoOptions(params),
            ...setAudioOptions(params),
            '-f',
            format[params.format].format,
            output
        ];
    }

    static getExtension(type) {
        return format[type].extension;
    }
}
