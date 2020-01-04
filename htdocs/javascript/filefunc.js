function jump(url) {
    location.href = url;
}

function disableActionButton() {
    document.f1.b_submit.value = "処理中...";
    document.f1.b_submit.disabled = true;
    document.f1.b_cancel.disabled = true;
}

function confirm_act(action) {
    if (confirm(action + "をします。よろしいですか？")) {
        disableActionButton();
        return true;
    } else {
        return false;
    }
}

function doMkdir(name, onSuccess, onError) {
    const params = jsUtils.url.getRawParams();

    jsUtils.fetch.request(
        {uri: stockerConfig.cgi_root + "/action/filefunc.cgi",
         headers: {"Content-Type": "application/x-www-form-urlencoded"},
         body: stocker.components.makeDirFileParam(params.dir, params.file, {mode: "do_newfolder", newname: name}),
         method: 'POST',
         format: 'json'
        }, function(json) {
            if (json.status === 'ok') {
                onSuccess();
            } else {
                onError(json.message);
            }
        }, function(error) {
            onError(error.message);
        }
    );
}

function doRemove(files, onSuccess, onError) {
    const f = files.shift();
    if (!f) {
        onSuccess();
        return;
    }

    f.statusIcon.innerHTML = bulmaRender.statusIcon["loading"];
    jsUtils.fetch.request(
        {uri: stockerConfig.cgi_root + "/action/filefunc.cgi",
         headers: {"Content-Type": "application/x-www-form-urlencoded"},
         body: stocker.components.makeDirFileParam(f.root, f.path, {mode: "do_delete"}),
         method: 'POST',
         format: 'json'
        }, function(json) {
            if (json.status === 'ok') {
                f.statusIcon.innerHTML = bulmaRender.statusIcon["done"];
                doRemove(files, onSuccess, onError);  // do recursively
            } else {
                f.statusIcon.innerHTML = bulmaRender.statusIcon["error"];
                onError(json.message);
            }
        }, function(error) {
            onError(error.message);
        }
    );
}

function doRename(renameArray, onSuccess, onError) {
    const r = renameArray.shift();
    if (!r) {
        onSuccess();
        return;
    }

    const f = r.list;
    const newName = encodeURIComponent(r.form.value);

    f.statusIcon.innerHTML = bulmaRender.statusIcon["loading"];
    jsUtils.fetch.request(
        {uri: stockerConfig.cgi_root + "/action/filefunc.cgi",
         headers: {"Content-Type": "application/x-www-form-urlencoded"},
         body: stocker.components.makeDirFileParam(f.root, f.path, {mode: "do_rename", newname: newName}),
         method: 'POST',
         format: 'json'
        }, function(json) {
            if (json.status === 'ok') {
                f.statusIcon.innerHTML = bulmaRender.statusIcon["done"];
                doRemove(renameArray, onSuccess, onError);  // do recursively
            } else {
                f.statusIcon.innerHTML = bulmaRender.statusIcon["error"];
                onError(json.message);
            }
        }, function(error) {
            onError(error.message);
        }
    );
}

function refreshMoveDestination(encoded_dir, url_path) {
    getDirectoryList(encoded_dir, url_path, 0, 0, getMoveDestination);
    document.f1.dest.value = url_path;
}

function getMoveDestination(data) {
    var dest_path = "";
    const properties_elem = data.getElementsByTagName('properties');
    if (properties_elem == null) {
        alert("ERROR: properties tag is not found");
        return;
    }

    const properties_name_elem = properties_elem.item(0).getElementsByTagName('name');
    if (properties_name_elem != null && properties_name_elem.item(0).firstChild) {
        dest_path = properties_name_elem.item(0).firstChild.data;
    }
    document.getElementById('dest_path').innerHTML = dest_path;

    const contents_elem = data.getElementsByTagName('contents');
    if (contents_elem == null) {
        alert("ERROR: files list is NULL");
        return;
    }

    const elements = contents_elem.item(0) ? contents_elem.item(0).getElementsByTagName('element') : new Array();
    if (elements == null) {
        alert("ERROR: files list has no elements");
        return;
    }

    removeOptions(document.f1.f_dest);
    document.f1.f_contents.value = "";

    // 上位パスのリンク
    if (dest_path.length != 0) {
        const uppath_elem = properties_elem.item(0).getElementsByTagName('up_path');
        if (uppath_elem != null) {
            if (uppath_elem.item(0).firstChild) {
                document.f1.f_dest.length = 1;
                document.f1.f_dest[0].value = uppath_elem.item(0).firstChild.data;
                document.f1.f_dest[0].text  = ".. (up a dir)";
            }
        }
    }
    const updir_elem = properties_elem.item(0).getElementsByTagName('up_dir');
    if (updir_elem != null) {
        if (updir_elem.item(0).firstChild) {
            var updir = updir_elem.item(0).firstChild.data;
            if (dest_path.length == 0) {
                document.getElementById('dest_path').innerHTML = updir;
            } else {
                if (updir.slice(-1) === "/") {
                    document.getElementById('dest_path').innerHTML = updir_elem.item(0).firstChild.data + dest_path;
                } else {
                    document.getElementById('dest_path').innerHTML = updir_elem.item(0).firstChild.data + "/" + dest_path;
                }
            }
        }
    }

    for (var i=0; i<elements.length; i++) {
        var name_elem = elements.item(i).getElementsByTagName('name');
        var path_elem = elements.item(i).getElementsByTagName('path');
        var type_elem = elements.item(i).getElementsByTagName('type');

        if (type_elem.item(0).firstChild.data === "DIRECTORY") {
            document.f1.f_dest.length += 1;
            document.f1.f_dest[document.f1.f_dest.length - 1].value = path_elem.item(0).firstChild.data;
            document.f1.f_dest[document.f1.f_dest.length - 1].text  = name_elem.item(0).firstChild.data;
        } else if (type_elem.item(0).firstChild.data === "FILE") {
            document.f1.f_contents.value += name_elem.item(0).firstChild.data + "\n";
        }
    }
}

function removeOptions(x) {
    if (x.hasChildNodes()) {
        while (x.childNodes.length > 0) {
            x.removeChild(x.firstChild);
        }
    }
}
