const filefunc_cgi = "%cgi_root%/filefunc.cgi";

var do_count = 0;

function jump(url) {
    location.href = url;
}

function confirm_act(action) {
    if (confirm(action + "をします。よろしいですか？")) {
        return true;
    } else {
        return false;
    }
}

function do_rename(rename_count) {
    if (confirm_act("名前の変更") === false) {
        return;
    }

    do_count = 0;
    for (var i=0; i<rename_count; i++) {
        var file = document.getElementsByName("file" + i)[0].value;
        var newname = encodeURIComponent(document.getElementsByName("newname" + i)[0].value);
        var param = "mode=do_rename&dir=" + document.f1.dir.value + "&file=" + file + "&newname=" + newname;

        var httpRequest = ajax_init();
        ajax_set_instance(httpRequest, function() { renameResult(httpRequest, rename_count); } );
        ajax_post(httpRequest, filefunc_cgi, param);
    }
}

function renameResult(httpRequest, rename_count) {
    if (httpRequest.readyState == 0 || httpRequest.readyState == 1 || httpRequest.readyState == 2) {
        //document.getElementById('sStatus').innerHTML = "読み込み中...";
    } else if (httpRequest.readyState == 4) {
        if (httpRequest.status == 200) {
            var data = httpRequest.responseXML;
        } else {
            alert("ERROR: " + httpRequest.status);
        }
        do_count++;
        if (do_count === rename_count) {
            location.href = document.f1.back.value;
        }
    }
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
