const CGI_ROOT = "/cgi-bin/stocker";

const CONVERTER_URI = {
    selector: CGI_ROOT + '/convertselect.cgi',
    list: CGI_ROOT + '/convertlist.cgi',
    movie_img: CGI_ROOT + '/get_movieimg.cgi',
    movie_info: CGI_ROOT + '/movie_info'
};

const PICTURE_VIEWER_URI = {
    get_picture: CGI_ROOT + '/get_picture.cgi',
    exif_info: CGI_ROOT + '/exif_info'
};

const MUSIC_PLAYER_URI = {
    get_media: CGI_ROOT + '/get_media.cgi',
    tag_info: CGI_ROOT + '/taginfo'
};

const URI = {
    filefunc: CGI_ROOT + '/filefunc.cgi',
    stocker: CGI_ROOT + '/stocker.cgi',
    get_dir: CGI_ROOT + '/get_dir',
    get_file: CGI_ROOT + '/get_file',
    thumbnail: CGI_ROOT + '/thumbnail.cgi',
    converter: CONVERTER_URI,
    picture_viewer: PICTURE_VIEWER_URI,
    music_player: MUSIC_PLAYER_URI
};

module.exports.stockerConfig = {
    cgi_root: CGI_ROOT,
    uri: URI
};
