const get_dir_cgi = "%cgi_root%/get_dir";

function getDirectoryList(encoded_dir, url_path, from, to, receive_func) {
    var param = "";

    param = "dir=" + encoded_dir + "&file=" + url_path;
    if (from !== "" && from !== 0) {
        param += "&from=" + from;
    }
    if (to !== "" && to !== 0) {
        param += "&to=" + to;
    }

    jsUtils.ajax.init();
    jsUtils.ajax.setOnSuccess(function(httpRequest) {
        receive_func(httpRequest.responseXML);
    });
    jsUtils.ajax.setOnError(function(httpRequest) {
        alert("ERROR: " + httpRequest.status);
    });

    jsUtils.ajax.post(get_dir_cgi, param);
}
