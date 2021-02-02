const mimeTypes = require('../../mime-types.json');

module.exports.getContentType = function (extension) {
    return mimeTypes[extension.toLowerCase()] || 'application/octet-stream';
};
