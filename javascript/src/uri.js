const htdocs_root = "/stocker";
const cgi_root = "/cgi-bin/stocker";

const converter_uri = {
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

module.exports.cgi = {
    filefunc: cgi_root + '/filefunc.cgi',
    stocker: cgi_root + '/stocker.cgi',
    get_dir: cgi_root + '/get_dir',
    get_file: cgi_root + '/get_file',
    thumbnail: cgi_root + '/thumbnail.cgi',
    converter: converter_uri,
    picture_viewer: picture_viewer_uri,
    music_player: music_player_uri
};
