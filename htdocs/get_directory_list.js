const get_dir_cgi = "%cgi_root%/get_dir";

function getDirectoryList(encoded_dir, url_path, from, to, receive_func) {
    var httpRequest = ajax_init();
    var param = "";

    if (!httpRequest) {
        alert('ディレクトリ内のファイル一覧取得に失敗しました');
        return;
    }

    param = "dir=" + encoded_dir + "&file=" + url_path;
    if (from !== "" && from !== 0) {
        param += "&from=" + from;
    }
    if (to !== "" && to !== 0) {
        param += "&to=" + to;
    }

    ajax_set_instance(httpRequest, function() { getDirectoryListResult(httpRequest, receive_func); } );
    ajax_post(httpRequest, get_dir_cgi, param);

    // sub-directory jump link
    document.getElementById('path_link').innerHTML = "";
    makeSubdirectoryLink(encoded_dir, url_path);

    document.file_check.target.value = url_path;  // for edit.cgi

    return;
}

function getDirectoryListResult(httpRequest, receive_func) {
//    try {
        if (httpRequest.readyState == 0 || httpRequest.readyState == 1 || httpRequest.readyState == 2) {
            //document.getElementById('sStatus').innerHTML = "読み込み中...";
        } else if (httpRequest.readyState == 4) {
            if (httpRequest.status == 200) {
                var data = httpRequest.responseXML;
                receive_func(data);
            } else {
                alert("ERROR: " + httpRequest.status);
            }
        }
//    } catch(e) {
//        alert("ERROR: " + e.description);
//    }
}

function makeSubdirectoryLink(encoded_dir, url_path) {
    var httpRequest = ajax_init();
    var param = "";

    if (!httpRequest) {
        document.getElementById('path_link').innerHTML = "";
        return;
    }

    param = "dir=" + encoded_dir + "&file=" + url_path + "&from=0&to=0";

    ajax_set_instance(httpRequest, function() { makeSubdirectoryLinkResult(httpRequest, encoded_dir, url_path); } );
    ajax_post(httpRequest, get_dir_cgi, param);
}

function makeSubdirectoryLinkResult(httpRequest, encoded_dir, url_path) {
//    try {
        if (httpRequest.readyState == 0 || httpRequest.readyState == 1 || httpRequest.readyState == 2) {
            //document.getElementById('sStatus').innerHTML = "読み込み中...";
        } else if (httpRequest.readyState == 4) {
            if (httpRequest.status == 200) {
                var data = httpRequest.responseXML;
                addSubdirectoryLink(data, encoded_dir, url_path);
            } else {
                alert("ERROR: " + httpRequest.status);
            }
        }
//    } catch(e) {
//        alert("ERROR: " + e.description);
//    }
}

function addSubdirectoryLink(data, encoded_dir, url_path) {
    const properties_elem = data.getElementsByTagName('properties');
    if (properties_elem == null) {
        return;
    }

    const title_elem = properties_elem.item(0).getElementsByTagName('name');
    if (title_elem != null) {
        if (title_elem.item(0).firstChild) {
            var s = document.getElementById('path_link').innerHTML;
            document.getElementById('path_link').innerHTML = "/ <a href=\"javascript:getDirectoryList('" + encoded_dir + "', '" + url_path + "', 0, " + boxes + ", directoryList)\">" + title_elem.item(0).firstChild.data + "</a> " + s;
        }
    }

    const uppath_elem = properties_elem.item(0).getElementsByTagName('up_path');
    if (uppath_elem != null) {
        if (uppath_elem.item(0).firstChild) {
            const up_path = uppath_elem.item(0).firstChild.data;
            if (up_path.length !== 0 && up_path !== "/") {
                makeSubdirectoryLink(encoded_dir, uppath_elem.item(0).firstChild.data);
            }
        }
    }
}

