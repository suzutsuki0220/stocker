const jsUtils = require('js-utils');
const uri = require('./uri.js');

function noWork() {}

/*
function filesList(elem, files) {
    var textarea = document.createElement('textarea');
    textarea.rows = "6";
    textarea.name = "f_contents";
    textarea.class = "fitWidth";
    textarea.readonly = "true";
    textarea.disabled = "disabled"

    for (var i=0; i<files.length; i++) {
        textarea.appendChild(document.createTextNode(files[i] + "\n"));
    }

    elem.appendChild(textarea);
}
*/

function makeDirFileParam(root, path, option = {}) {
    const optionParam = jsUtils.url.makeQueryString(option);

    return 'dir=' + root + '&file=' + path + (optionParam ? '&' + optionParam : '');
}

module.exports.makeDirFileParam = makeDirFileParam;

module.exports.makePathParams = function(root, path, option) {
    const r = root || '';
    const p = path || '';
    return makeDirFileParam(r, p, option);
};

module.exports.backToList = function(root, path) {
    window.location.href = uri.htdocs_root + '/list.html' + '?' + makeDirFileParam(root, path);
};

module.exports.getFileProperties = function(root, path, onSuccess, onError = noWork) {
    jsUtils.fetch.request(
        {uri: uri.cgi.get_dir,
         body: makeDirFileParam(root, path),
         method: 'POST',
         format: 'text'
        }, function(text) {
            const xml = jsUtils.xml.getDom(text);
            const directory = jsUtils.xml.getFirstFoundChildNode(xml, 'directory');
            const properties = jsUtils.xml.getDataInElements(directory, 'properties', ['name', 'elements', 'up_path', 'up_dir'])[0];
            onSuccess(properties);
        }, onError
    );
};

/**
 * URIパラメータで指定されたfile/dirの実名を取得します
 * サーバーに問い合わせてjson形式で返ります
 **/
module.exports.getFilenames = function(onSuccess, onError = noWork) {
    const param = jsUtils.url.getQueryInUrl();  // it has root, path

    const init = {
        uri: uri.cgi.filename,
        method: 'POST',
        format: 'json',
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        },
        body: param
    };

    jsUtils.fetch.request(init , onSuccess, onError);
};

/**
 * URIパラメータに指定されているpath値を取得します (複数全て)
 **/
module.exports.getParamFile = function() {
    const myQuery = jsUtils.url.getQueryInUrl();
    const params = new URLSearchParams(myQuery);

    return params.getAll('file');
};
