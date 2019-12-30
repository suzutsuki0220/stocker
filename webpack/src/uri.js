const htdocs_root = "%htdocs_root%";
const cgi_root = "%cgi_root%";

const converter_uri = {
    form: cgi_root + '/converter.cgi',
    selector: cgi_root + '/convertselect.cgi',
    list: cgi_root + '/convertlist.cgi',
    movie_img: cgi_root + '/get_movieimg.cgi',
    movie_info: cgi_root + '/movie_info'
};

const picture_viewer_uri = {
    get_picture: cgi_root + '/get_picture.cgi',
    exif_info: cgi_root + '/exif_info'
};

const music_player_uri = {
    get_media: cgi_root + '/get_media.cgi',
    tag_info: cgi_root + '/taginfo'
};

module.exports.cgi_root = cgi_root;
module.exports.htdocs_root = htdocs_root;
module.exports.list = htdocs_root + '/list.html';

module.exports.cgi = {
    edit:  cgi_root + '/edit.cgi',
    filename: cgi_root + '/filename.cgi',
    get_dir: cgi_root + '/get_dir',
    get_file: cgi_root + '/get_file',
    thumbnail: cgi_root + '/thumbnail.cgi',
    converter: converter_uri,
    picture_viewer: picture_viewer_uri,
    music_player: music_player_uri
};

// アイコンのURL
module.exports.icon = {
    audio     : htdocs_root + '/icons/mimetypes/audio-x-generic.png',
    txt       : htdocs_root + '/icons/mimetypes/text-x-generic.png',
    pdf       : htdocs_root + '/icons/mimetypes/application-pdf.png',
    gps       : htdocs_root + '/icons/actions/chronometer.png',
    doc       : htdocs_root + '/icons/mimetypes/application-msword.png',
    excel     : htdocs_root + '/icons/mimetypes/application-vnd.ms-excel.png',
    ppt       : htdocs_root + '/icons/mimetypes/application-vnd.ms-powerpoint.png',
    unknown   : htdocs_root + '/icons/categories/system-help.png',
    directory : htdocs_root + '/icons/places/folder-orange.png'
};
