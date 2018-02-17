function setScreenSize() {
    var s_width = 640;
    var s_height = 480;

    var in_width  = document.documentElement.clientWidth;
    var in_height = document.documentElement.clientHeight;
    if(in_width && in_height) {
        s_width = in_width;
        s_height = in_height;
    }
}

function allCheck() {
    for (var key in visible_list) {
        document.getElementsByName(visible_list[key])[0].checked = true;
    }
    for (var key in un_visible_list) {
        document.getElementsByName(un_visible_list[key]).value = 1;
    }
}

function allUnCheck() {
    for (var key in visible_list) {
        document.getElementsByName(visible_list[key])[0].checked = false;
    }
    for (var key in un_visible_list) {
        document.getElementsByName(un_visible_list[key]).value = 0;
    }
}

function isAnyChecked() {
    var files = document.getElementsByName("file");

    if (files) {
        for (var i=0; i<files.length; i++) {
            if (files[i].checked === true) {
                return true;
            }
        }
    }

    return false;
}

function toggleCheckFile(value) {
    var files = document.getElementsByName("file");

    if (files) {
        for (var i=0; i<files.length; i++) {
            if (files[i].value === value) {
                // チェックを付ける・外す
                files[i].checked = ! files[i].checked;
                break;
            }
        }
    }
}

function actionClickedIcon (action, clicked_path) {
    if (isAnyChecked()) {
        toggleCheckFile(clicked_path);
    } else {
        if (action.indexOf('dir:') === 0) {
            reloadDirectoryList(document.file_check.fm_dir.value, action.substr(4), 0, boxes);
        } else {
            location.href = action;
        }
    }
}

function changeDirectory() {
    reloadDirectoryList(document.file_check.fm_dir.value, "", 0, boxes);
}

function jump_to(from, to) {
    document.file_check.from.value = from;
    document.file_check.to.value = to;
    document.file_check.submit();
}

function jump_select(boxes) {
    document.file_check.from.value = document.getElementsByName('boxval')[0].value - boxes;
    document.file_check.to.value = document.getElementsByName('boxval')[0].value;
    document.file_check.submit();
}

function printIcon(box_width, box_height, path, name, size, last_modified, icon, action) {
    var html = "";

    html += "<div class=\"imagebox\" style=\"width: " + box_width + "px; height: " + box_height + "px\">";
    html += "<p class=\"image\" style=\"width: " + box_width + "px; height: 75px\">";
    html += "<a href=\"javascript:actionClickedIcon('" + action + "', '" + path + "')\"><img src=\"" + icon + "\"></a></p>";
    html += "<span style=\"position: absolute; top: 3px; right: 3px;\">";
    html += "<input type=\"checkbox\" name=\"file\" value=\"" + path + "\">";
    html += "</span>";
    html += "<p class=\"caption\">";
    html += "<a href=\"javascript:actionClickedIcon('" + action + "', '" + path + "')\">" + name + "</a><br>";
    html += size + "<br>" + last_modified;
    html += "</p></div>";

    document.getElementById('directoryListArea').innerHTML += html;
}

function reloadDirectoryList(encoded_dir, url_path, from, to) {
    getDirectoryList(encoded_dir, url_path, from, to, directoryList);

    // sub-directory jump link
    document.getElementById('path_link').innerHTML = "";
    makeSubdirectoryLink(encoded_dir, url_path);

    document.file_check.target.value = url_path;  // for edit.cgi
}

function makeSubdirectoryLink(encoded_dir, url_path) {
    const get_dir_cgi = "%cgi_root%/get_dir";

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
            document.getElementById('path_link').innerHTML = "/ <a href=\"javascript:reloadDirectoryList('" + encoded_dir + "', '" + url_path + "', 0, " + boxes + ")\">" + title_elem.item(0).firstChild.data + "</a> " + s;
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

