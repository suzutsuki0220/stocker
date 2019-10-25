var actionParam = new Array();

function addFileCheckAction(list_json) {
    const al = document.querySelector('#action_list');
    al.innerHTML = '操作: ';

    const select = document.createElement('select');
    select.name = "operation";
    select.size = "1";
    select.addEventListener("change", checkedAction);

    var fragment = document.createDocumentFragment();
    var option_nop = document.createElement('option');
    option_nop.value = "nop";
    option_nop.text = "-- 操作を選択 --";
    fragment.appendChild(option_nop);

    for(var i=0; i<list_json.length; i++) {
        const l = list_json[i];
        var option = document.createElement('option');
        option.value = l.id;
        option.text = l.title;
        fragment.appendChild(option);
    }

    select.appendChild(fragment);
    al.appendChild(select);
}

function makeActionList() {
    const action_list = document.getElementById('action_list');
    action_list.innerHTML = '<i class="fas fa-spinner fa-pulse"></i> 操作一覧取得中';

    jsUtils.fetch.request({
        uri: stockerConfig.htdocs_root + "/action_param.json",
        format: 'json',
        method: 'GET'
    }, function(json) {
        addFileCheckAction(json);
        actionParam = json;
    }, function(error) {
        console.warn(error);
        action_list.innerHTML = 'error: ' + error.message;
    });
}

function checkedAction() {
    var sw = document.file_check.operation.value;
    document.file_check.operation.options[0].selected = true;  // 変更後はnopに

    for (var i=0; i<actionParam.length; i++) {
        const ap = actionParam[i];
        if (ap.id === sw) {
            const params = Object.assign(ap.parameters, {
                dir: document.file_check.fm_dir.value,
                path: document.file_check.target.value,
                file: getCheckedFiles()  // stocker_list.js
            });
            location.href = stockerConfig.htdocs_root + "/action/" + ap.form + '?' + jsUtils.url.makeQueryString(params);
        }
    }
}
