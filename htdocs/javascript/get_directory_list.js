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
};

function refreshDirectorySelector(div, root, path) {
    getDirectoryList(root, path, 0, 0, function(data) {
        let filesArray = new Array();
        let directoriesArray = new Array();

        const directory = jsUtils.xml.getFirstFoundChildNode(data, 'directory');
        const contents = jsUtils.xml.getFirstFoundChildNode(directory, 'contents');
        if (!contents) {
            return;
        }
        const properties = jsUtils.xml.getDataInElements(directory, 'properties', ['name', 'up_path'])[0];
        const upPath = properties.up_path;

        const elements = jsUtils.xml.getDataInElements(contents, 'element', ["name", "path", "type", "size", "last_modified"]);
        if (!elements) {
            return;
        }

        for (var i=0; i<elements.length; i++) {
            const e = elements[i];
            if (e.type === "DIRECTORY") {
                directoriesArray.push(e.name);
            } else {
                filesArray.push(e.name);
            }
        }

        const container = document.createElement('div');
        container.style.display = "flex";
        container.style.flexDirection = "row";
        container.style.alignItems = "stretch";
        container.style.justifyContent = "space-between";

        const dirList = document.createElement('div');
        dirList.style.flexBasis = "50%";
        dirList.style.borderStyle = "solid";
        dirList.style.borderWidth = "2px";
        dirList.style.borderColor = "hsl(0, 0%, 86%)";
        bulmaRender.makeTable(dirList, ["フォルダー"], directoriesArray);
        container.appendChild(dirList);

        const fileList = document.createElement('div');
        fileList.style.flexBasis = "50%";
        fileList.style.borderStyle = "solid";
        fileList.style.borderWidth = "2px";
        fileList.style.borderColor = "hsl(0, 0%, 86%)";
        bulmaRender.makeTable(fileList, ["中身"], filesArray);
        container.appendChild(fileList);

        div.appendChild(container);
    });
}

function makeDirectorySelector(elem, selectedRoot = "", selectedPath = "", rows = 6) {
    const div = document.createElement('div');

    elem.innerHTML = "";
    getRootDirectories(function(data) {
        const rootSelector = makeRootSelector("", data, refreshDirectorySelector, selectedRoot);
        div.appendChild(rootSelector);

        refreshDirectorySelector(div, rootSelector.value, selectedPath);

        elem.appendChild(div);
    });
}
