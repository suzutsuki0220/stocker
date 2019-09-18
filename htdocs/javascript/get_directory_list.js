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
        alert("ERROR: " + stockerConfig.uri.get_dir + " param: " + param + " status: " + httpRequest.status);
    });

    jsUtils.ajax.post(stockerConfig.uri.get_dir, param);
}
