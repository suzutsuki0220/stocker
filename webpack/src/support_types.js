// 拡張子判定
module.exports.pattern = {
    audio: /\.(flac|wav|wma|aif|aiff|aifc|ram|ra|mp3|m4a)$/i,
    image: /\.(jpg|jpeg|png|gif|bmp|tif|tiff)$/i,
    video: /\.(avi|flv|mov|mpg|mpeg|mpe|m2p|ts|mts|m2ts|mp4|m4v|mpg4|asf|wmv|3gp)$/i,
    gps:   /\.(kml|kmz|gpx|nmea)$/i,
    txt:   /\.(txt|log)$/i,
    doc:   /\.(doc|dot|docx)$/i,
    excel: /\.(xls|xlsx)$/i,
    ppt:   /\.(ppt|pptx)$/i,
    pdf:   /\.(pdf)$/i
};

function isSupport(obj, mime) {
    const can = obj.canPlayType(mime);
    return (can === 'maybe' || can === 'probably');
}

module.exports.browserPlayableMovie = function() {
    let extensions = "";
    const video = document.createElement('video');

    if (isSupport(video, "video/mp4")) {
        extensions += extensions ? "|" : "";
        extensions += 'mov|mp4|m4v|mpg4';
    }
    if (isSupport(video, "video/webm")) {
        extensions += extensions ? "|" : "";
        extensions += 'webm';
    }
    if (isSupport(video, "video/ogg")) {
        extensions += extensions ? "|" : "";
        extensions += 'ogv|ogx|oga|ogg|spx';
    }

    return new RegExp('\.(' + extensions + ')$', 'i');
};

module.exports.browserPlayableAudio = function() {
    let extensions = "";
    const audio = document.createElement('audio');

    if (isSupport(audio, "audio/mpeg")) {
        extensions += extensions ? "|" : "";
        extensions += 'mp3';
    }
    if (isSupport(audio, "audio/ogg")) {
        extensions += extensions ? "|" : "";
        extensions += 'ogg|oga|ogx';
    }
    if (isSupport(audio, "audio/wav")) {
        extensions += extensions ? "|" : "";
        extensions += 'wav';
    }
    if (isSupport(audio, "audio/mp4")) {
        extensions += extensions ? "|" : "";
        extensions += 'mp4|m4a';
    }

    return new RegExp('\.(' + extensions + ')$', 'i');
};
