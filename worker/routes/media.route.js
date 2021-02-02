const fs = require('fs');
const path = require('path');
const jsUtils = require('js-utils');
const { execFileSync } = require('child_process');
const supportTypes = require('../../webpack/src/support_types.js');
const thumbnailConf = require('../src/config-file.js').load('/thumbnail.conf');
const FFmpegOption = require('../src/ffmpeg-option.js');

const StockerLib = require('../build/Release/stockerlib').StockerLib;
const stockerLib = new StockerLib();

// FFMpegのオプション
function composeMovieImageOptions(size, input, output, params = {}) {
    return new FFmpegOption().compose(input, output, { ...params, s_w: size, s_h: '-1', frames: '1', nolog: true, r: '1', format: 'jpeg' }, 0);
}

function composeThumbnailImageOptions(size, input, output) {
    // convert (ImageMagick)のオプション 
    return [input, "-thumbnail", size, "-strip", output];
}

function getCachePath(width, root, path) {
    const decodedRoot = decodeURIComponent(root.replace(/\+/g, ' '));

    const _root = stockerLib.decodeUrlPath(root, '');
    const decodedPath = stockerLib.decodeUrlPath(root, path).substring(_root.length);

    return thumbnailConf['thm_cache_dir'] + '/' + width + '/' + decodedRoot + '/' + decodedPath;
}

function isCacheAvailable(cachePath, decodedPath) {
    try {
        const fstat = fs.statSync(cachePath, { throwIfNoEntry: false });
        if (fstat) {
            const origStat = fs.statSync(decodedPath);
            if (Math.abs(fstat.mtimeMs - origStat.mtimeMs) < 1000) {
                //console.log("image cache available => " + cachePath);
                return true;
            }
        }
        fs.unlinkSync(cachePath);  // cleanup mismatch cache
    } catch (e) {
        //console.log(e);
    }

    //console.log("image cache is disable");
    return false;
}

function makeCache(width, origPath, cachePath) {
    const fname = jsUtils.file.getNameFromPath(cachePath);
    fs.mkdirSync(fname.dirname, { recursive: true });

    if (supportTypes.pattern.video.test(origPath)) {
        execFileSync(thumbnailConf['ffmpeg_cmd'], composeMovieImageOptions(width, origPath, cachePath));
    } else if (supportTypes.pattern.image.test(origPath)) {
        execFileSync(thumbnailConf['convert_cmd'], composeThumbnailImageOptions(width, origPath, cachePath));
    }

    try {
        const fstat = fs.statSync(origPath, { throwIfNoEntry: false });
        if (fstat) {
            const fd = fs.openSync(cachePath);
            fs.futimesSync(fd, fstat.atime, fstat.mtime);
        }
    } catch (e) {
        //console.log(e);
    }
}

function sendCacheImage(width, req, res) {
    try {
        const cachePath = getCachePath(width, req.params.root, req.params.path);
        const decoded = stockerLib.decodeUrlPath(req.params.root, req.params.path);

        if (isCacheAvailable(cachePath, decoded) === false) {
            makeCache(width, decoded, cachePath);
        }
        res.type('image/jpeg');
        res.sendFile(cachePath, { dotfiles: 'deny' });
    } catch (e) {
        console.warn(e);
        res.sendStatus(404);
    }
}

function sendTemporaryFile(type, temporary, res) {
    try {
        res.type(type);
        res.sendFile(temporary, { dotfiles: 'deny' }, function (err) {
            // 送った後に消す
            const tempdir = jsUtils.file.getNameFromPath(temporary).dirname;
            fs.rmdirSync(tempdir, { recursive: true });
        });
    } catch (e) {
        console.warn(e);
        res.sendStatus(404);
    }
}

function makeVideoImage(req, output) {
    const decoded = stockerLib.decodeUrlPath(req.params.root, req.params.path);

    const width = req.query.size || 640;
    execFileSync(thumbnailConf['ffmpeg_cmd'], composeMovieImageOptions(width, decoded, output, req.query));
}

module.exports = function (app) {
    const apiRest = '/api/v1/media';

    app.get(apiRest + '/:root/:path(*)/thumbnail', function (req, res) {
        sendCacheImage(thumbnailConf['thumb_size'], req, res)
    });
    app.get(apiRest + '/:root/:path(*)/vga', function (req, res) {
        sendCacheImage(640, req, res)
    });
    app.get(apiRest + '/:root/:path(*)/videoimage', function (req, res) {
        const tempdir = fs.mkdtempSync(path.join(thumbnailConf['temporary_dir'], 'stocker-'));
        const tempfile = path.join(tempdir, 'videoimage.jpg');
        makeVideoImage(req, tempfile);
        sendTemporaryFile('image/jpeg', tempfile, res);
    });
};
