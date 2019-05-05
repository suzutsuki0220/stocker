const CGI_ROOT = "/cgi-bin/stocker";

const CGI_URI = {
    stocker: CGI_ROOT + '/stocker.cgi',
    get_dir: CGI_ROOT + '/get_dir',
    get_file: CGI_ROOT + '/get_file'
};

module.exports.stockerConfig = {
    cgi_root: CGI_ROOT,
    uri: CGI_URI
};
