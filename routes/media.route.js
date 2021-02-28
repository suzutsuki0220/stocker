const fs = require('fs');
const path = require('path');
const jsUtils = require('js-utils');
const { execFileSync } = require('child_process');
const contentTypes = require('../webpack/src/content-types.js');
const supportTypes = require('../webpack/src/support_types.js');
const FFmpegOption = require('../src/ffmpeg-option.js');
const mediaLib = require('../build/Release/medialib');
const stockerConf = require('../config/stocker-conf.json');

const StockerLib = require('../build/Release/stockerlib').StockerLib;
const stockerLib = new StockerLib();

// FFMpegのオプション
function composeMovieImageOptions(size, input, output, params = {}) {
    return new FFmpegOption().compose(input, output, { ...params, s_w: size, s_h: '-1', frames: '1', nolog: true, r: '1', format: 'jpeg' }, 0);
}

// convert (ImageMagick)のオプション
function composeThumbnailImageOptions(size, input, output) {
    return [input, "-thumbnail", size, "-strip", output];
}

function getCachePath(width, root, path) {
    const decodedRoot = decodeURIComponent(root.replace(/\+/g, ' '));

    const _root = stockerLib.decodeUrlPath(root, '');
    const decodedPath = stockerLib.decodeUrlPath(root, path).substring(_root.length);

    return stockerConf.path.cache + '/' + width + '/' + decodedRoot + '/' + decodedPath;
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

function makeCache(width, origPath, cachePath, log) {
    const fname = jsUtils.file.getNameFromPath(cachePath);
    fs.mkdirSync(fname.dirname, { recursive: true });

    if (supportTypes.pattern.video.test(origPath)) {
        execFileSync(stockerConf.commands.ffmpeg, composeMovieImageOptions(width, origPath, cachePath));
    } else if (supportTypes.pattern.image.test(origPath)) {
        execFileSync(stockerConf.commands.convert, composeThumbnailImageOptions(width, origPath, cachePath));
    }

    try {
        const fstat = fs.statSync(origPath, { throwIfNoEntry: false });
        if (fstat) {
            const fd = fs.openSync(cachePath);
            fs.futimesSync(fd, fstat.atime, fstat.mtime);
        }
    } catch (e) {
        log.warn(e);
    }
}

function sendCacheImage(width, req, res, log) {
    try {
        const cachePath = getCachePath(width, req.params.root, req.params.path);
        const decoded = stockerLib.decodeUrlPath(req.params.root, req.params.path);

        if (isCacheAvailable(cachePath, decoded) === false) {
            makeCache(width, decoded, cachePath, log);
        }
        res.type('image/jpeg');
        res.sendFile(cachePath, { dotfiles: 'deny' });
    } catch (e) {
        log.warn(e);
        res.sendStatus(404);
    }
}

function sendTemporaryFile(type, temporary, res, log) {
    try {
        res.type(type);
        // 部分的な転送を許可すると変換処理が増えてしまうために acceptRanges は無効にする
        res.sendFile(temporary, { dotfiles: 'deny', acceptRanges: false }, function (err) {
            // 送った後に消す
            const tempdir = jsUtils.file.getNameFromPath(temporary).dirname;
            fs.rmdirSync(tempdir, { recursive: true });
        });
    } catch (e) {
        log.warn(e);
        res.sendStatus(404);
    }
}

function sendResponseBuffer(arrayBuffer, res) {
    if (!arrayBuffer) {
        res.sendStatus(404);
        return;
    }

    let mimeType = "";
    for (let i = 0; i < 32; i++) {
        const code = new Int8Array(arrayBuffer.slice(i, i + 1))[0];
        if (code === 0) {
            break;
        }
        mimeType += String.fromCharCode(new Int8Array(arrayBuffer.slice(i, i + 1))[0]);
    }
    const size = new Uint32Array(arrayBuffer.slice(32, 36));
    res.type(mimeType);
    res.send(Buffer.from(arrayBuffer, 36, size));
}

function makeVideoImage(req, output) {
    const decoded = stockerLib.decodeUrlPath(req.params.root, req.params.path);

    const width = req.query.size || 640;
    execFileSync(stockerConf.commands.ffmpeg, composeMovieImageOptions(width, decoded, output, req.query));
}

function sendAudio(type, req, res, log) {
    const decoded = stockerLib.decodeUrlPath(req.params.root, req.params.path);
    const name = jsUtils.file.getNameFromPath(decoded);

    if (name.extension === type) {  // 拡張子が同じならばファイルをそのまま送信
        res.sendFile(decoded, { dotfiles: 'deny' });
    } else {
        // 要求される形式に合わせて変換する
        const tempdir = fs.mkdtempSync(path.join(stockerConf.path.temporary, 'stocker-'));
        const tempfile = path.join(tempdir, name.filename + '.' + FFmpegOption.getExtension(type));
        execFileSync(stockerConf.commands.ffmpeg, new FFmpegOption().compose(decoded, tempfile, { nolog: true, ab: stockerConf.audioConvertBitrate, format: type }, 0));
        sendTemporaryFile(contentTypes.getContentType(FFmpegOption.getExtension(type)), tempfile, res, log);
    }
}

module.exports = function (app, log) {
    const apiRest = stockerConf.htdocsRoot + '/api/v1/media';

    app.get(apiRest + '/:root/:path(*)/mp3', function (req, res) {
        sendAudio('mp3', req, res, log);
    });
    app.get(apiRest + '/:root/:path(*)/ogg', function (req, res) {
        sendAudio('ogg', req, res, log);
    });
    app.get(apiRest + '/:root/:path(*)/wav', function (req, res) {
        sendAudio('wav', req, res, log);
    });
    app.get(apiRest + '/:root/:path(*)/thumbnail', function (req, res) {
        sendCacheImage(stockerConf.thumbnailSize, req, res, log)
    });
    app.get(apiRest + '/:root/:path(*)/vga', function (req, res) {
        sendCacheImage(640, req, res, log)
    });
    app.get(apiRest + '/:root/:path(*)/videoimage', function (req, res) {
        const tempdir = fs.mkdtempSync(path.join(stockerConf.path.temporary, 'stocker-'));
        const tempfile = path.join(tempdir, 'videoimage.jpg');
        makeVideoImage(req, tempfile);
        sendTemporaryFile('image/jpeg', tempfile, res, log);
    });
    app.get(apiRest + '/:root/:path(*)/exif', function (req, res) {
        res.type('application/json');
        res.send(mediaLib.getExif(req.params.root, req.params.path));
    })
    app.get(apiRest + '/:root/:path(*)/exifThumbnail', function (req, res) {
        const arrayBuffer = mediaLib.getExifThumbnail(req.params.root, req.params.path);
        sendResponseBuffer(arrayBuffer, res);
    })
    app.get(apiRest + '/:root/:path(*)/movieInfo', function (req, res) {
        res.type('application/json');
        res.send(mediaLib.getMovieInfo(req.params.root, req.params.path));
    });
    app.get(apiRest + '/:root/:path(*)/coverArt', function (req, res) {
        const arrayBuffer = mediaLib.getCoverArt(req.params.root, req.params.path);
        sendResponseBuffer(arrayBuffer, res);
    });
    app.get(apiRest + '/:root/:path(*)/mediaTag', function (req, res) {
        res.type('application/json');
        res.send(mediaLib.getMediaTag(req.params.root, req.params.path));
    });
};
