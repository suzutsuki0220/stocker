const htdocs_root = "%htdocs_root%";
const cgi_root = "%cgi_root%";

const picture_viewer_uri = {
    exif_info: cgi_root + '/exif_info'
};

const music_player_uri = {
    tag_info: cgi_root + '/taginfo'
};

module.exports.cgi_root = cgi_root;
module.exports.htdocs_root = htdocs_root;
module.exports.list = htdocs_root + '/list.html';

module.exports.cgi = {
    edit: cgi_root + '/edit.cgi',
    picture_viewer: picture_viewer_uri,
    music_player: music_player_uri
};

// アイコンのURL
module.exports.icon = {
    audio: htdocs_root + '/icons/mimetypes/audio-x-generic.png',
    txt: htdocs_root + '/icons/mimetypes/text-x-generic.png',
    pdf: htdocs_root + '/icons/mimetypes/application-pdf.png',
    gps: htdocs_root + '/icons/actions/chronometer.png',
    doc: htdocs_root + '/icons/mimetypes/application-msword.png',
    excel: htdocs_root + '/icons/mimetypes/application-vnd.ms-excel.png',
    ppt: htdocs_root + '/icons/mimetypes/application-vnd.ms-powerpoint.png',
    unknown: htdocs_root + '/icons/categories/system-help.png',
    directory: htdocs_root + '/icons/places/folder-orange.png'
};
