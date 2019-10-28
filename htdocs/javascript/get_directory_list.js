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

function makeDirectoryList(elem, directory, selected = '') {
    const select = document.createElement('select');
    select.name = "operation";
    select.size = "1";
//    select.addEventListener("change", checkedAction);

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

elem.appendChild(fragment);
//    select.appendChild(fragment);
//    elem.appendChild(select);
};
