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
    for (var key in visible_list) {
        if (document.getElementsByName(visible_list[key])[0].checked) {
            return true;
        }
    }
    return false;
}

function actionClickedIcon (action, elem) {
    if (isAnyChecked()) {
        // チェックを付ける・外す
        document.getElementsByName(elem)[0].checked = ! document.getElementsByName(elem)[0].checked;
    } else {
        if (action.indexOf('dir:') === 0) {
            getDirectoryList(encoded_dir, action.substr(4), 0, boxes, directoryList);
        } else {
            location.href = action;
        }
    }
}

function changeDirectory() {
    document.file_check.dir.value = document.file_check.fm_dir.value;
    document.file_check.in.value = "";
    document.file_check.submit();
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
    html += "<input type=\"checkbox\" name=\"" + path + "\" value=\"1\">";
    html += "</span>";
    html += "<p class=\"caption\">";
    html += "<a href=\"javascript:actionClickedIcon('" + action + "', '" + path + "')\">" + name + "</a><br>";
    html += size + "<br>" + last_modified;
    html += "</p></div>";

    document.getElementById('directoryListArea').innerHTML += html;
}
