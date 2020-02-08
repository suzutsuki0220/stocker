function disableActionButton() {
    document.f1.b_submit.value = "処理中...";
    document.f1.b_submit.disabled = true;
    document.f1.b_cancel.disabled = true;
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

function callFileFunc(parameterList, onSuccess, onError) {
    const p = parameterList.shift();
    if (!p) {
        onSuccess();
        return;
    }

    const f = p.list;
    f.statusIcon.innerHTML = render.bulma.statusIcon["loading"];
    jsUtils.fetch.request(
        {uri: stockerConfig.cgi_root + "/action/filefunc.cgi",
         headers: {"Content-Type": "application/x-www-form-urlencoded"},
         body: stocker.components.makeDirFileParam(f.root, f.path, p.parameter),
         method: 'POST',
         format: 'json'
        }, function(json) {
            if (json.status === 'ok') {
                f.statusIcon.innerHTML = render.bulma.statusIcon["done"];
                callFileFunc(parameterList, onSuccess, onError);  // do recursively
            } else {
                f.statusIcon.innerHTML = render.bulma.statusIcon["error"];
                onError(json.message);
            }
        }, function(error) {
            f.statusIcon.innerHTML = render.bulma.statusIcon["error"];
            onError(error.message);
        }
    );
}
