/* global jsUtils, stocker, bulmaRender */
let selectedParam = new Object();

function initSelectedParam() {
    selectedParam.root = "";
    selectedParam.path = "";
}

function getDirectoryList(encoded_dir, url_path, from, to, receive_func) {
    let option = new Object();
    if (from) {
        option.from = from;
    }
    if (to) {
        option.to = to;
    }
    const param = stocker.components.makePathParams(encoded_dir, url_path, option);

    jsUtils.ajax.init();
    jsUtils.ajax.setOnSuccess(function(httpRequest) {
        receive_func(httpRequest.responseXML);
    });
    jsUtils.ajax.setOnError(function(httpRequest) {
        console.warn("ERROR: " + stockerConfig.uri.get_dir + " param: " + param + " status: " + httpRequest.status);
    });

    jsUtils.ajax.post(stockerConfig.uri.get_dir, param);
}

function getRootDirectories(callback) {
    jsUtils.fetch.request(
        {uri: stocker.uri.cgi_root + "/directory.cgi",
         format: "json"
        }, function(json) {
            callback(json);
        }, function(error) {
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
    for (var i=0; i<directory.length; i++) {
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

function directoryListStyleFactory(elem, height) {
    elem.style.flexBasis = "50%";
    elem.style.height = height + "px";
    elem.style.overflow = "auto";
    elem.style.borderStyle = "solid";
    elem.style.borderWidth = "2px";
    elem.style.borderColor = "hsl(0, 0%, 86%)";
}

function refreshDirectorySelector(div, root, path, height) {
    getDirectoryList(root, path, 0, 0, function(data) {
        let filesArray = new Array();
        let directoriesArray = new Array();

        selectedParam.root = root;
        selectedParam.path = path;

        //clear
        div.innerHTML = "";

        const directory = jsUtils.xml.getFirstFoundChildNode(data, 'directory');
        const properties = jsUtils.xml.getDataInElements(directory, 'properties', ['name', 'up_path', 'up_dir'])[0];

        const nameArea = document.createElement('div');
        const upButton = document.createElement('a');
        upButton.onclick = function() {
            refreshDirectorySelector(div, root, properties.up_path, height);
        };
        upButton.innerHTML = '<i class="fas fa-arrow-up"></i>';
        nameArea.appendChild(upButton);

        const span = document.createElement('span');
        span.innerHTML = properties.up_dir + "/" + properties.name;
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

        const contents = jsUtils.xml.getFirstFoundChildNode(directory, 'contents');
        if (!contents) {
            return;
        }

        const elements = jsUtils.xml.getDataInElements(contents, 'element', ["name", "path", "type", "size", "last_modified"]);
        if (!elements) {
            return;
        }

        for (var i=0; i<elements.length; i++) {
            const e = elements[i];
            if (e.type === "DIRECTORY") {
                const a = document.createElement('a');
                a.onclick = function() {
                    refreshDirectorySelector(div, root, e.path, height);
                };
                a.innerHTML = e.name;
                directoriesArray.push(a);
            } else {
                filesArray.push(e.name);
            }
        }

        bulmaRender.makeTable(dirList, ["フォルダー"], directoriesArray);
        bulmaRender.makeTable(fileList, ["中身"], filesArray);
    });
}

function makeDirectorySelector(elem, selectedRoot = "", selectedPath = "", height = 300) {
    const div = document.createElement('div');
    const directorySelector = document.createElement('div');

    initSelectedParam();
    elem.innerHTML = "";
    getRootDirectories(function(data) {
        const rootSelector = makeRootSelector("", data, function() {
            refreshDirectorySelector(directorySelector, rootSelector.value, "", height)
        }, selectedRoot);
        div.appendChild(rootSelector);
        div.appendChild(directorySelector);
        elem.appendChild(div);

        refreshDirectorySelector(directorySelector, rootSelector.value, selectedPath, height);
    });
}
