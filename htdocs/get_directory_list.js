const get_dir_cgi = "%cgi_root%/get_dir";

function getDirectoryList(base_name, url_path, from, to, receive_func) {
    var httpRequest = ajax_init();
    var param = "";

    if (!httpRequest) {
        alert('ディレクトリ内のファイル一覧取得に失敗しました');
        return false;
    }

    param = "dir=" + base_name + "&file=" + url_path;
    if (from !== "" && from !== 0) {
        param += "&from=" + from;
    }
    if (to !== "" && to !== 0) {
        param += "&to=" + to;
    }

    ajax_set_instance(httpRequest, function() { getDirectoryListResult(httpRequest, receive_func); } );
    ajax_post(httpRequest, get_dir_cgi, param);

    return;
}

function getDirectoryListResult(httpRequest, receive_func) {
    try {
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
    } catch(e) {
        alert("ERROR: " + e.description);
    }
}

