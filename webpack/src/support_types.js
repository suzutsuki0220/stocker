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
module.exports.browserPlayableMovie = /\.(mov|mp4|m4v|mpg4)$/i;
