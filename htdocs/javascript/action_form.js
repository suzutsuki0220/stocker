const myQuery = jsUtils.url.getQueryInUrl();

function getFileName(filenameObj, path) {
    for (var i=0; i<filenameObj.length; i++) {
        const f = filenameObj[i];
        if (path === f.path) {
            return f.name;
        }
    }

    return "";
}

function filenameTable(elem, realNames) {
    elem.innerHTML = "";

    const files = stocker.components.getParamFile();

    let list = new Array();
    for (let i=0; i<files.length; i++) {
        const num = i + 1;
        list.push([num.toString(10), getFileName(realNames, files[i]), '<span id="status_' + i + '">未実行</span>']);
    }

    bulmaRender.makeTable(elem, ['No', 'ファイル名', '実行結果'], list);
}

function setBackToStocker(f) {
    document.getElementById('cancelButton').onclick = function() {stocker.components.backToList(f.dir, f.location)};
    document.getElementById('backAnchor').onclick = function() {stocker.components.backToList(f.dir, f.location)};
}
