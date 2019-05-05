var duration = 0; // 動画の長さ(秒)
var loading = false;  // previewの更新多発を抑止するフラグ
var load_again = false;  // preview読み込み中に値が変わって再度読み直しが必要か判断するフラグ
var sceneList = new Array();

const GRAY_PAD = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAAAwCAIAAAAuKetIAAAAQklEQVRo3u3PAQkAAAgDMLV/mie0hSBsDdZJ6rOp5wQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBATuLGnyAnZizub2AAAAAElFTkSuQmCC";

const skip_options = [
    [3600, "60 分"],
    [1800, "30 分"],
    [900, "15 分"],
    [180, "3 分"],
    [60, "1 分"],
    [30, "30 秒"],
    [15, "15 秒"],
    [5, "5 秒"],
    [3, "3 秒"],
    [1, "1 秒"],
    [0.5, "1/2 秒"],
    [0.25, "1/4 秒"],
    [0.125, "1/8 秒"],
    [0.063, "1/16 秒"],
    [0.031, "1/32 秒"],
    [0.001, "1/100 秒"],
];

function buildSkipOptions() {
    const default_value = 180;

    for(var i=0; i<skip_options.length; i++) {
        let op = document.createElement("option");
        op.value = skip_options[i][0] * 1000;
        op.text = skip_options[i][1];
        op.selected = default_value === skip_options[i][0] ? true : false;
        document.f1.skip.appendChild(op);
    }
}

// キーボードのキー入力イベント
function setKeyDownEvent() {
    if (document.addEventListener) {
        document.addEventListener("keydown", keyDownWork);
    } else if (document.attachEvent) {
        document.attachEvent("onkeydown", keyDownWork);
    }
}

function setTime() {
    if (!window.opener || window.opener.closed) {
        window.alert("メインウィンドウが閉じられています");
        return;
    }

    const parent_window = window.opener.document;
    var ss = document.getElementsByName('selectedTimeStart')[0].value;
    var te = document.getElementsByName('selectedTimeEnd')[0].value;
    const duration = getEncTimeDuration(ss, te);

    const f_num = params.f_num;
    parent_window.getElementsByName('ss' + f_num)[0].value = ss;
    parent_window.getElementsByName('tend' + f_num)[0].value = duration > 0 ? te : ss;
    parent_window.getElementsByName('t' + f_num)[0].value = getFormatTimeFromSecond(jsUtils.value.normalize(duration, 0, duration));
}

// durationが取得出来た時にシーンのデータを取得する
function callGetSceneData() {
    if (scene_list_path) {
        getSceneData(stockerConfig.uri.get_file, encoded_dir, scene_list_path);
    }
}

function apply() {
    if (document.f1.btnApply.disabled === true) {
        return;
    }

    setTime();
    closeWindow();
}

function closeWindow() {
    window.close();
}

function getImageURL(elem) {
    var ss = elem.value;
    return stockerConfig.uri.converter.movie_img + "?" + jsUtils.url.getQueryInUrl() + "&size=640&set_position=1&ss=" + ss;
}

function reloadImage() {
    if (loading) {
      load_again = true;
      return;
    }

    var elem, reloading_elem, selected_time_elem;
    if (getRadioButtonValue(document.f1.controlTimeSwitch) === "start") {
      elem = document.f1.previewStart;
      reloading_elem = document.getElementById("reloadingStart");
      selected_time_elem = document.f1.selectedTimeStart;
    } else {
      elem = document.f1.previewEnd;
      reloading_elem = document.getElementById("reloadingEnd");
      selected_time_elem = document.f1.selectedTimeEnd;
    }

    setLoading(elem, reloading_elem, selected_time_elem);
}

function setLoading(preview_elem, reloading_elem, selected_time_elem) {
    if (preview_elem.addEventListener) {
      preview_elem.addEventListener("load", function() { unsetLoading(preview_elem, reloading_elem); }, false);
      preview_elem.addEventListener("error", function() { showGrayPad(preview_elem, reloading_elem); }, false);
      preview_elem.addEventListener("abort", function() { showGrayPad(preview_elem, reloading_elem); }, false);
    } else if (preview_elem.attachEvent) {
      preview_elem.attachEvent("onload", function() { unsetLoading(preview_elem, reloading_elem); });
      preview_elem.attachEvent("onerror", function() { showGrayPad(preview_elem, reloading_elem); });
      preview_elem.attachEvent("onabort", function() { showGrayPad(preview_elem, reloading_elem); });
    }

    loading = true;
    preview_elem.src = getImageURL(selected_time_elem);
    reloading_elem.style.display = "block";
}

function unsetLoading(preview_elem, reloading_elem) {
    if (preview_elem.removeEventListener) {
      preview_elem.removeEventListener("load", function() { unsetLoading(preview_elem); }, false);
      preview_elem.removeEventListener("error", function() { showGrayPad(preview_elem); }, false);
      preview_elem.removeEventListener("abort", function() { showGrayPad(preview_elem); }, false);
    } else if (preview_elem.detachEvent) {
      preview_elem.detachEvent("onload", function() { unsetLoading(preview_elem); });
      preview_elem.detachEvent("onerror", function() { showGrayPad(preview_elem); });
      preview_elem.detachEvent("onabort", function() { showGrayPad(preview_elem); });
    }

    reloading_elem.style.display = "none";
    loading = false;

    if (load_again) {
      load_again = false;
      reloadImage();
    }
}

function selectSkipDown(cnt) {
    var idx = document.f1.skip.selectedIndex;
    idx += cnt;
    if (idx < 0) {
      idx = 0;
    }
    if (idx > document.f1.skip.options.length -1) {
      idx = document.f1.skip.options.length -1;
    }
    document.f1.skip.options[idx].selected = true;
}

function showGrayPad(preview_elem, reloading_elem) {
    preview_elem.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAAAwCAIAAAAuKetIAAAAQklEQVRo3u3PAQkAAAgDMLV/mie0hSBsDdZJ6rOp5wQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBATuLGnyAnZizub2AAAAAElFTkSuQmCC";
    unsetLoading(preview_elem, reloading_elem);
}

function keyDownWork(e) {
    var key_code = e.keyCode;

    if (key_code === 13) {  // enter
        apply();
        return;
    } else if (key_code === 27) { // escape
        closeWindow();
        return;
    }

    if (document.getElementsByName('selectedTimeStart')[0] === document.activeElement ||
        document.getElementsByName('selectedTimeEnd')[0] === document.activeElement
    ) {
        return;
    }

    switch(key_code) {
      case 37: // left
      case 71:
        addTime(document.f1.skip.value * (-1));
        break;
      case 39: // right
      case 72:
        addTime(document.f1.skip.value);
        break;
      case 38: // up
        selectSkipDown(-1);
        break;
      case 40: // down
        selectSkipDown(1);
        break;
      case 70: // f
        addTime(-500);
        break;
      case 68: // d
        addTime(-1000);
        break;
      case 83: // s
        addTime(-15000);
        break;
      case 65: // a
        addTime(-60000);
        break;
      case 74: // j
        addTime(500);
        break;
      case 75: // k
        addTime(1000);
        break;
      case 76: // l
        addTime(15000);
        break;
      case 187: // ;
        addTime(60000);
        break;
    }
}

function getSelectedTimeElem() {
    var elem;
    if (getRadioButtonValue(document.f1.controlTimeSwitch) === "start") {
        elem = document.f1.selectedTimeStart;
    } else {
        elem = document.f1.selectedTimeEnd;
    }

    return elem;
}

function adjustStartAndEndTime() {
    var start = document.f1.selectedTimeStart;
    var end = document.f1.selectedTimeEnd;

    var start_time = getSecondFromFormatTime(start.value);
    var end_time   = getSecondFromFormatTime(end.value);

    if (start_time > end_time) {
        if (getRadioButtonValue(document.f1.controlTimeSwitch) === "start") {
            end_time = start_time;
            end.value = getFormatTimeFromSecond(end_time * 1000);
            setLoading(document.f1.previewEnd, document.getElementById("reloadingEnd"), getSelectedTimeElem());
        } else {
            start_time = end_time;
            start.value = getFormatTimeFromSecond(start_time * 1000);
            setLoading(document.f1.previewStart, document.getElementById("reloadingStart"), getSelectedTimeElem());
        }
    }
}

function addTime(num) {
    const minRange = 0;
    const maxRange = duration * 1000;

    var elem = getSelectedTimeElem();
    var time_str = elem.value;

    if (isValidFormatTime(time_str) === false) {
        window.alert("時間の書式が不正です");
        document.f1.btnApply.disabled = true;
        return;
    }
    document.f1.btnApply.disabled = false;

    var miliTime = getSecondFromFormatTime(time_str) * 1000;
    var preTm = miliTime;

    miliTime += parseInt(num);
    if (miliTime < minRange) {
        miliTime = minRange;
    }
    if (miliTime > maxRange) {
        miliTime = maxRange;
    }

    if (preTm !== miliTime) {
        elem.value = getFormatTimeFromSecond(miliTime);
        moveSeekPosition(document.f1.seekFrom, elem);
        reloadImage();
        adjustStartAndEndTime();
    }
}

function getMovieDuration(movie_info_url, base_name, path, vno) {
    const ajax = jsUtils.ajax;
    ajax.init();

    ajax.setOnSuccess(function(httpRequest) {
        getMovieDurationResult(httpRequest.responseXML, vno);
        callGetSceneData();
    });
    ajax.setOnError(function(httpRequest) {
        alert("動画の長さ取得に失敗しました");
    });

    const query = "dir=" + base_name + "&file=" + path;
    ajax.post(movie_info_url, query);
}

function getMovieDurationResult(data, vno) {
    const xml = jsUtils.xml;
    const movie_info = xml.getFirstFoundChildNode(data, 'movie_info');
    const hhmmssxxx = xml.getFirstFoundTagData(movie_info.childNodes, 'duration');
    if (hhmmssxxx) {
        duration = getSecondFromFormatTime(hhmmssxxx);
        moveSeekPosition(document.f1.seekFrom, getSelectedTimeElem());

        const videos = xml.getDataInElements(movie_info, 'video', ["no", "disp_width", "disp_height"]);
        for (var i=0; i<videos.length; i++) {
            const v = videos[i];
            if (vno === v.no) {
                const disp_width   = parseInt(v.disp_width);
                const disp_height  = parseInt(v.disp_height);
                if (disp_width.length !== 0 && disp_height !== 0) {
                    setPreviewSize(document.getElementById('startPreviewArea'), disp_width, disp_height);
                    setPreviewSize(document.getElementById('endPreviewArea'), disp_width, disp_height);
                }
            }
        }
    }
}

function getSceneData(getfile_cgi, base_name, scene_path) {
    const ajax = jsUtils.ajax;
    ajax.init();

    ajax.setOnSuccess(getSceneDataResult);
    ajax.setOnError(function(httpRequest) {});

    const query = "dir=" + base_name + "&file=" + scene_path + "&mime=text/plain";
    ajax.post(getfile_cgi, query);
}

function getSceneDataResult(httpRequest) {
    var sp, ep;
    var data = httpRequest.responseText;

    sp = 0;
    while((ep = data.indexOf("\n", sp)) != -1) {
        var line = data.substring(sp, ep);
        pushSceneList(line);
        sp = ep + 1;
    }
    if (sp < data.length) {
        var line = data.substring(sp);
        pushSceneList(line);
    }

    if (sceneList.length > 0) {
        var html;
        html  = "<input type=\"button\" name=\"btnPrevScene\" onClick=\"getNextScene(-1)\" value=\"＜\">&nbsp;シーン&nbsp;";
        html += "<input type=\"button\" name=\"btnNextScene\" onClick=\"getNextScene(1)\" value=\"＞\">";
        document.getElementById('sceneSelectArea').innerHTML = html;
    }
}

function pushSceneList(scene_data_line) {
    var delim_pos = scene_data_line.indexOf(" ", 0);
    var hhmmssxxx = scene_data_line.substring(0, delim_pos);

    if (isValidFormatTime(hhmmssxxx) === true) {
        var milisec = Math.floor(getSecondFromFormatTime(hhmmssxxx) * 1000);
        sceneList.push(milisec);
        addTickMark(document.getElementById('sceneListMarks'), Math.floor(milisec / (duration * 1000) * 1000));
    }
}

function getNextScene(next_step) {
    var elem = getSelectedTimeElem();
    var milisec = Math.floor(getSecondFromFormatTime(elem.value) * 1000);
    var base_index, next_index;

    for (var base_index=0; base_index<sceneList.length; base_index++) {
        if (milisec < sceneList[base_index]) {
            if (next_step > 0) {
                next_step--;
            }
            break;
        } else if (milisec == sceneList[base_index]) {
            break;
        }
    }

    next_index = base_index + next_step;

    if (next_index < 0) {
        elem.value = "00:00:00.000";
    } else if (next_index >= sceneList.length) {
        elem.value = getFormatTimeFromSecond(duration * 1000);
    } else {
        elem.value = getFormatTimeFromSecond(sceneList[next_index]);
    }

    changeSelectedTime(elem);
}

// シークバーの位置が変更された時に実行される処理
function changeTime(elemSeekBar) {
    var elemTimeSec = getSelectedTimeElem();
    var seekPoint = duration * elemSeekBar.value; // 本来ならばmaxで割った後にミリ秒にする為に1000を掛けるが、maxは1000のため省略
    elemTimeSec.value = getFormatTimeFromSecond(seekPoint);
    reloadImage();
    adjustStartAndEndTime();
}

// 時間の値が変更された時にシークバーを動かす処理
function moveSeekPosition(elemSeekBar, elemTimeSec) {
    var seekPoint = Math.floor(getSecondFromFormatTime(elemTimeSec.value) / duration * 1000);
    elemSeekBar.value = seekPoint;
}

// 入力欄の時間が変更された時の処理
function changeSelectedTime(elem) {
    var val = elem.value;
    if (isValidFormatTime(val) === false) {
        document.getElementById('messageArea').style.color = "#ff0000";
        document.getElementById('messageArea').innerHTML = "Timeの書式が不正です";
        document.f1.btnApply.disabled = true;
    } else {
        document.getElementById('messageArea').innerHTML = "";
        moveSeekPosition(document.f1.seekFrom, elem);
        reloadImage();
        adjustStartAndEndTime();
        document.f1.btnApply.disabled = false;
    }
}

function addTickMark(elem, value) {
    var option = document.createElement('option');
    option.setAttribute('value', value);
    //option.setAttribute('label', "1"); // not support
    elem.appendChild(option);
}

function doControlTimeSwitched() {
    var elemTimeSec = getSelectedTimeElem();
    moveSeekPosition(document.f1.seekFrom, elemTimeSec);
}

function switchTimeControl(index) {
    document.f1.controlTimeSwitch[index].checked = true;
    doControlTimeSwitched();
}
