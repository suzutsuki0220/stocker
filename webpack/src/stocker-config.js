const uri = require('./uri.js');

module.exports.stockerConfig = {
    htdocs_root: uri.htdocs_root,
    cgi_root: uri.cgi_root,
    uri: uri.cgi
};
