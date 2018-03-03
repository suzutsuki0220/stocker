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

