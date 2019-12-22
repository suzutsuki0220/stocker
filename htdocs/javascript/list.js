var trimWork = [];
var elements = null;

var boxes = 500;  // TODO: for Pagination (ページ分け)
//my $boxes = $disp_box_x * $disp_box_y * 3;  # 3スクロール分
let encoded_dir;

let root, path;

window.addEventListener("load", function(event) {
    encoded_dir = document.file_check.fm_dir.value;

    const params = jsUtils.url.getRawParams();
    root = params.dir || "";
    path = params.path || "";
//    const cont_from =  jsUtils.value.replaceNanToZero(params.from);
//    const cont_to   =  jsUtils.value.replaceNanToZero(params.to);

    initializeWindow(root, path);
});

function initializeWindow(root, path) {
    makeActionList();
    getRootDirectories(function(data) {
        makeDirectoryList(document.getElementById('fm_dir'), data, root);
        reloadDirectoryList(document.getElementById('fm_dir').value, path); //, cont_from, cont_to);
    });
}

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

function getCheckedFiles() {
    var checked = new Array();
    var files = document.getElementsByName("file");
    if (files) {
        for (var i=0; i<files.length; i++) {
            if (files[i].checked === true) {
                checked.push(files[i].value);
            }
        }
    }

    return checked;
}

function allCheck(flag = true) {
    var files = document.getElementsByName("file");
    if (files) {
        for (var i=0; i<files.length; i++) {
            files[i].checked = flag;
        }
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

function displayDirectoryProperty(directory) {
    const properties = jsUtils.xml.getDataInElements(directory, 'properties', ['name', 'up_path'])[0];

    // titleをディレクトリ名にする
    document.title = properties.name;

    // 上位パスのリンク
    if (properties.name) {
        document.getElementById('uppath').innerHTML = "<a href=\"javascript:reloadDirectoryList('" + encoded_dir + "', '" + properties.up_path + "', 0, " + boxes + ")\">↑UP</a>";
    } else {
        document.getElementById('uppath').innerHTML = "";  // 最上位にはnameがない
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

function printIcon(id, path, name, size, last_modified, icon, action) {
    const box_width     = 120;   // 単位 px
    const box_height    = 140;   // 単位 px
//    const box_space     = 5;     // BOXの隙間 単位 px

    var html = "";

    html += "<div class=\"imagebox\" style=\"width: " + box_width + "px; height: " + box_height + "px\">";
    html += "<p class=\"image\" style=\"width: " + box_width + "px; height: 75px\">";
    html += "<a href=\"javascript:actionClickedIcon('" + action + "', '" + path + "')\"><canvas id=\"" + id + "\"></canvas></a></p>";
    html += "<span style=\"position: absolute; top: 3px; right: 3px;\">";
    html += "<input type=\"checkbox\" name=\"file\" value=\"" + path + "\">";
    html += "</span>";
    html += "<p class=\"caption\">";
    html += "<a href=\"javascript:actionClickedIcon('" + action + "', '" + path + "')\">" + name + "</a><br>";
    html += size + "<br>" + last_modified;
    html += "</p></div>";

    document.getElementById('directoryListArea').innerHTML += html;
    addTrimWork(id, icon);
}

function clearList() {
    document.getElementById('directoryListArea').innerHTML = "";
    trimWork = [];  // clear trimWork
}

function addTrimWork(id, imgUrl) {
    var work = new Object();
    work.id = id;
    work.imgUrl = imgUrl;

    trimWork.push(work);
}

function doTrimWork() {
    for (var i=0; i<trimWork.length; i++) {
        var work = trimWork[i];
        trimThumbnail(work.id, work.imgUrl);
    }
}

function trimThumbnail(id, imgUrl) {
    const TRIM_SIZE = 75;
    var canvas = document.getElementById(id);
    var ctx = canvas.getContext('2d');

    canvas.width = canvas.height = TRIM_SIZE;

    var img = new Image();
    img.src = imgUrl;

    // imgは読み込んだ後でないとwidth,heightが0
    img.onload = function() {
        // 横長か縦長かで場合分けして描画位置を調整
        var width, height, xOffset, yOffset;
        if (img.width > img.height) {
            height = TRIM_SIZE;
            width = img.width * (TRIM_SIZE / img.height);
            xOffset = -(width - TRIM_SIZE) / 2;
            yOffset = 0;
        } else {
            width = TRIM_SIZE;
            height = img.height * (TRIM_SIZE / img.width);
            yOffset = -(height - TRIM_SIZE) / 2;
            xOffset = 0;
        }
        ctx.drawImage(img, xOffset, yOffset, width, height);
    };
}

// 戻る操作で前のページとするURLを追加する
function addBackHistory(encoded_dir, url_path) {
    const url = stocker.uri.list + '?dir=' + encoded_dir + '&file=' + url_path;
    history.pushState({dir: encoded_dir, file: url_path}, '', url);
}

window.onpopstate = function(event) {
    const s = event.state;
    initializeWindow(s.dir, s.file);
};

function clearNarrowList() {
    document.getElementById('narrow').value = "";
    narrowList();  // reload
}

function narrowList() {
    reloadDirectoryList(document.getElementById('fm_dir').value, path); //, cont_from, cont_to);
}

function reloadDirectoryList(encoded_dir, url_path, from = 0, to = 999999, addHistory = true) {
    if (addHistory === true) { // TODO: addHistory フラグを追加したのは綺麗ではないので、読み込み処理だけを別関数にしたい
        addBackHistory(encoded_dir, url_path);
    }
    document.getElementById('directoryListArea').innerHTML = "読み込み中...";
    document.getElementById('path_link').innerHTML = "";
    document.file_check.target.value = url_path;  // for edit.cgi
    path = url_path;

    getDirectoryList(encoded_dir, url_path, from, to, function(dir_xml) {
        directoryList(dir_xml, document.getElementById('narrow').value);
        addSubdirectoryLink(dir_xml, encoded_dir, url_path);
    });
}

function narrowMatch(name, key) {
    if (!key) {
        return true;
    }

    return (name.indexOf(key) >= 0) ? true : false;
}

function directoryList(data, narrowKey="") {
    encoded_dir = document.file_check.fm_dir.value;

    const directory = jsUtils.xml.getFirstFoundChildNode(data, 'directory');

    displayDirectoryProperty(directory);
    const contents = jsUtils.xml.getFirstFoundChildNode(directory, 'contents');
    if (contents == null) {
      document.getElementById('directoryListArea').innerHTML = "ファイル・ディレクトリは存在しません";
      return;
    }

    elements = jsUtils.xml.getDataInElements(contents, 'element', ["name", "path", "type", "size", "last_modified"]);
    if (elements == null) {
      alert("ERROR: files list has no elements");
      return;
    }

    clearList();
    for (var i=0; i<elements.length; i++) {
        const e = elements[i];
        if (narrowMatch(e.name, narrowKey)) {
            printIcons(i, e);
        }
    }
    doTrimWork();
}

// TODO: -> Breadcrumbs
function makeSubdirectoryLink(encoded_dir, url_path) {
    const param = "dir=" + encoded_dir + "&file=" + url_path + "&from=0&to=0";

    const ajax = jsUtils.ajax;
    ajax.init();
    ajax.setOnSuccess(function(httpRequest) {
        addSubdirectoryLink(httpRequest.responseXML, encoded_dir, url_path);
    });
    ajax.post(stocker.uri.cgi.get_dir, param);
}

function addSubdirectoryLink(data, encoded_dir, url_path) {
    const xml = jsUtils.xml;
    const directory = xml.getFirstFoundChildNode(data, 'directory');
    const properties = xml.getDataInElements(directory, 'properties', ['name', 'up_path'])[0];

    if (properties['name']) {
        var s = document.getElementById('path_link').innerHTML;
        document.getElementById('path_link').innerHTML = "/ <a href=\"javascript:reloadDirectoryList('" + encoded_dir + "', '" + url_path + "', 0, " + boxes + ")\">" + properties['name'] + "</a> " + s;
    }

    const up_path = properties['up_path'];
    if (up_path.length !== 0 && up_path !== "/") {
        makeSubdirectoryLink(encoded_dir, up_path);
    }
}

function downloadWork() {
    var files = document.getElementsByName("file");
    if (files && elements) {
        for (var i=0; i<files.length; i++) {
            if (files[i].checked === false) {
                continue;
            }

            for (var j=0; j<elements.length; j++) {
                if (files[i].value === elements[j].path) {
                    handleDownload(files[i].value, elements[j].name);
                    break;
                }
            }
        }
    }
}

function handleDownload(filepath, filename) {
    const get_url = stocker.uri.cgi.get_file + "?mime=application/force-download&dir=" + root + "&file=" + filepath;
    jsUtils.file.DownloadWithDummyAnchor(get_url, filename);
}
