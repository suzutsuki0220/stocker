/* global jsUtils, ModalContent, stocker, render */
let selectedParam = new Object();

function initSelectedParam() {
    selectedParam.root = "";
    selectedParam.path = "";
}

function getDirectoryProperties(root, url_path, from, to, receive_func) {
    const option = new Object();
    if (from) {
        option.from = from;
    }
    if (to) {
        option.to = to;
    }
    const optionParam = jsUtils.url.makeQueryString(option);

    fetch('/api/v1/storage/' + root + '/' + url_path + '/properties' + (optionParam ? '?' + optionParam : ''), {
        method: 'GET',
        mode: 'same-origin',
        cache: 'no-cache',
        credentials: 'same-origin',
        redirect: 'error',
        referrerPolicy: 'no-referrer'
    }).then(function (response) {
        if (response.ok) {
            return response.json();
        } else {
            return Promise.reject(new Error(response.status + ' ' + response.statusText));
        }
    }).then(receive_func);
}

function getRootDirectories(callback) {
    jsUtils.fetch.request(
        {
            uri: "/api/v1/storage/root-paths",
            format: "json"
        }, function (json) {
            callback(json);
        }, function (error) {
            console.warn(error);
        }
    );
}

function makeRootSelector(name, directory, onChanged, selected = '') {
    const select = document.createElement('select');
    select.name = name;
    select.id = name;
    select.size = "1";
    select.addEventListener("change", onChanged);

    var fragment = document.createDocumentFragment();
    for (var i = 0; i < directory.length; i++) {
        var directoryList = document.createElement('option');
        if (directory[i].encoded === selected) {
            directoryList.selected = true;
        }
        directoryList.value = directory[i].encoded;
        directoryList.text = directory[i].name;
        fragment.appendChild(directoryList);
    }

    select.appendChild(fragment);

    return select;
}

function newDirectoryAnchor(div, height) {
    const flexStyle = "display: flex; flex-direction: row; justify-content: space-between";
    const elm = render.basic.element.newNode('div', '', { style: flexStyle });
    const anchor = render.basic.element.newNode('a', '<i class="fas fa-folder-plus"></i>', { style: 'display: flex; align-items: center' });
    anchor.onclick = function () {
        const modalContent = new ModalContent(function () {
            refreshDirectorySelector(div, selectedParam.root, selectedParam.path, height);
        });
        modalContent.newFolder(selectedParam.root, selectedParam.path);
    };
    elm.appendChild(
        render.basic.element.newNode('div', 'フォルダー', { style: 'display: flex' })
    );
    elm.appendChild(anchor);

    return elm;
}

function directoryListStyleFactory(elem, height) {
    elem.style.flexBasis = "50%";
    elem.style.height = height + "px";
    elem.style.overflow = "auto";
    elem.style.borderStyle = "solid";
    elem.style.borderWidth = "2px";
    elem.style.borderColor = "hsl(0, 0%, 86%)";
}

function refreshDirectorySelector(div, root, path, height) {
    getDirectoryProperties(root, path, NaN, NaN, function (data) {
        let filesArray = new Array();
        let directoriesArray = new Array();

        selectedParam.root = root;
        selectedParam.path = path;

        //clear
        div.innerHTML = "";

        const nameArea = document.createElement('div');
        const upButton = document.createElement('a');
        upButton.onclick = function () {
            refreshDirectorySelector(div, root, data.properties.up_path, height);
        };
        upButton.innerHTML = '<i class="fas fa-arrow-up"></i>';
        nameArea.appendChild(upButton);

        const span = document.createElement('span');
        span.innerHTML = data.properties.dirname + "/" + data.properties.name;
        nameArea.appendChild(span);
        div.appendChild(nameArea);

        const container = document.createElement('div');
        container.style.display = "flex";
        container.style.flexDirection = "row";
        container.style.alignItems = "stretch";
        container.style.justifyContent = "space-between";

        const dirList = document.createElement('div');
        directoryListStyleFactory(dirList, height);
        container.appendChild(dirList);

        const fileList = document.createElement('div');
        directoryListStyleFactory(fileList, height);
        container.appendChild(fileList);
        div.appendChild(container);

        if (data.elements) {
            for (var i = 0; i < data.elements.length; i++) {
                const e = data.elements[i];
                if (e.type === "DIRECTORY") {
                    const a = document.createElement('a');
                    a.onclick = function () {
                        refreshDirectorySelector(div, root, e.path, height);
                    };
                    a.innerHTML = e.name;
                    directoriesArray.push(a);
                } else {
                    filesArray.push(e.name);
                }
            }
        }

        const anchor = newDirectoryAnchor(div, height);
        dirList.appendChild(render.bulma.elements.table([anchor], directoriesArray));
        fileList.appendChild(render.bulma.elements.table(["中身"], filesArray));
    });
}

function makeDirectorySelector(elem, selectedRoot = "", selectedPath = "", height = 300) {
    const div = document.createElement('div');
    const directorySelector = document.createElement('div');

    initSelectedParam();
    elem.innerHTML = "";
    getRootDirectories(function (data) {
        const rootSelector = makeRootSelector("", data, function () {
            refreshDirectorySelector(directorySelector, rootSelector.value, "", height)
        }, selectedRoot);
        div.appendChild(rootSelector);
        div.appendChild(directorySelector);
        elem.appendChild(div);

        refreshDirectorySelector(directorySelector, rootSelector.value, selectedPath, height);
    });
}
