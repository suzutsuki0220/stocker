const uri = require('./uri.js');
const support_types = require('./support_types.js');

module.exports.stockerConfig = {
    htdocs_root: uri.htdocs_root,
    cgi_root: uri.cgi_root,
    uri: uri.cgi,
    supportTypes: support_types
};
