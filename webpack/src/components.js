const jsUtils = require('js-utils');
const uri = require('./uri.js');

function noWork() { }

function makeDirFileParam(root, path = '', option = {}) {
    const optionParam = jsUtils.url.makeQueryString(option);

    return 'dir=' + root + '&file=' + path + (optionParam ? '&' + optionParam : '');
}

module.exports.makeDirFileParam = makeDirFileParam;

module.exports.makePathParams = function (root, path, option) {
    const r = root || '';
    const p = path || '';
    return makeDirFileParam(r, p, option);
};

module.exports.backToList = function (root, path) {
    window.location.href = uri.htdocs_root + '/list.html' + '?' + makeDirFileParam(root, path);
};

module.exports.getParamRoot = function () {
    const myQuery = jsUtils.url.getQueryInUrl();
    const params = jsUtils.url.getRawParams(myQuery);

    return params.dir || "";
};

/**
 * URIパラメータに指定されているpath値を取得します (複数全て)
 **/
module.exports.getParamFile = function () {
    const myQuery = jsUtils.url.getQueryInUrl();
    const params = new URLSearchParams(myQuery);

    return params.getAll('file');
};
