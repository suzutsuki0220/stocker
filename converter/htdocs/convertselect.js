var duration = 0; // 動画の長さ(秒)
var loading = false;  // previewの更新多発を抑止するフラグ
var load_again = false;  // preview読み込み中に値が変わって再度読み直しが必要か判断するフラグ
var sceneList = new Array();

// キーボードのキー入力イベント
if (document.addEventListener) {
    document.addEventListener("keydown", keyDownWork);
} else if (document.attachEvent) {
    document.attachEvent("onkeydown", keyDownWork);
}

window.onload = function() {
    document.f1.btnApply.focus();
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

function reloadImage() {
    if (loading) {
      load_again = true;
      return;
    }

    if (document.preview.addEventListener) {
      document.preview.addEventListener("load", unsetLoading, false);
      document.preview.addEventListener("error", showGrayPad, false);
      document.preview.addEventListener("abort", showGrayPad, false);
    } else if (document.preview.attachEvent) {
      document.preview.attachEvent("onload", unsetLoading);
      document.preview.attachEvent("onerror", showGrayPad);
      document.preview.attachEvent("onabort", showGrayPad);
    }

    loading = true;
    document.getElementById("preview").src = getImageURL();
    document.getElementById("PreviewReloading").style.display = "block";
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

function showGrayPad() {
    document.getElementById("preview").src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAAAwCAIAAAAuKetIAAAAQklEQVRo3u3PAQkAAAgDMLV/mie0hSBsDdZJ6rOp5wQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBATuLGnyAnZizub2AAAAAElFTkSuQmCC";
    unsetLoading();
}

function unsetLoading() {
    if (document.preview.removeEventListener) {
      document.preview.removeEventListener("load", unsetLoading, false);
      document.preview.removeEventListener("error", showGrayPad, false);
      document.preview.removeEventListener("abort", showGrayPad, false);
    } else if (document.preview.detachEvent) {
      document.preview.detachEvent("onload", unsetLoading);
      document.preview.detachEvent("onerror", showGrayPad);
      document.preview.detachEvent("onabort", showGrayPad);
    }

    document.getElementById("PreviewReloading").style.display = "none";
    loading = false;

    if (load_again) {
      load_again = false;
      reloadImage();
    }
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

    if (document.getElementsByName('selectedTime')[0] === document.activeElement) {
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

function addTime(num) {
    const minRange = 0;
    const maxRange = duration * 1000;
    var time_str = document.f1.selectedTime.value;

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
        document.f1.selectedTime.value = getFormatTimeFromSecond(miliTime);
        moveSeekPosition(document.f1.seekFrom, document.f1.selectedTime);
        reloadImage();
    }
}

function getMovieDuration(movie_info_url, base_name, path) {
    var httpRequest = ajax_init();
    if (httpRequest) {
        var query = "dir=" + base_name + "&file=" + path;
        ajax_set_instance(httpRequest, function() { getMovieDurationResult(httpRequest) });
        ajax_post(httpRequest, movie_info_url, query);
    } else {
        alert("動画ファイルの情報取得に失敗しました");
    }
}

function getMovieDurationResult(httpRequest) {
    if (httpRequest.readyState == 4) {
        if (httpRequest.status == 200) {
            var data = httpRequest.responseXML;
            var width, height;

            const vno = window.opener.document.enc_setting.v_map.value;

            var movie_info_elem = getXmlFirstFindChildNode(data, 'movie_info');
            if (movie_info_elem !== null) {
                var hhmmssxxx = getXmlFirstFindTagData(movie_info_elem.childNodes, 'duration');
                duration = getSecondFromFormatTime(hhmmssxxx);
                moveSeekPosition(document.f1.seekFrom, document.f1.selectedTime);

                var videos = movie_info_elem.getElementsByTagName('video');
                for (var i=0; i<videos.length; i++) {
                    var video_elem = videos[i].childNodes;
                    const vid_no = getXmlFirstFindTagData(video_elem, 'no');
                    if (vid_no === vno) {
                        const disp_width   = getXmlFirstFindTagData(video_elem, 'disp_width');
                        const disp_height  = getXmlFirstFindTagData(video_elem, 'disp_height');
                        if (disp_width.length !== 0 && disp_height !== 0) {
                            setPreviewSize(document.getElementById('preview'), parseInt(disp_width), parseInt(disp_height));
                        }
                    }
                }
            }
        }
    }
}

function getSceneData(getfile_cgi, base_name, scene_path) {
    var httpRequest = ajax_init();
    if (httpRequest) {
        var query = "dir=" + base_name + "&file=" + scene_path + "&mime=text/plain";
        ajax_set_instance(httpRequest, function() { getSceneDataResult(httpRequest) });
        ajax_post(httpRequest, getfile_cgi, query);
    }
}

function getSceneDataResult(httpRequest) {
    if (httpRequest.readyState == 4) {
        if (httpRequest.status == 200) {
            var sp, ep;
            var data = httpRequest.responseText;
            var html;

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
                html  = "<input type=\"button\" name=\"btnPrevScene\" onClick=\"getNextScene(document.getElementsByName('selectedTime')[0], -1)\" value=\"＜\">&nbsp;シーン&nbsp;";
                html += "<input type=\"button\" name=\"btnNextScene\" onClick=\"getNextScene(document.getElementsByName('selectedTime')[0], 1)\" value=\"＞\">";
                document.getElementById('sceneSelectArea').innerHTML = html;
            }
        }
    }
}

function pushSceneList(scene_data_line) {
    var delim_pos = scene_data_line.indexOf(" ", 0);
    var hhmmssxxx = scene_data_line.substring(0, delim_pos);

    if (isValidFormatTime(hhmmssxxx) === true) {
        var milisec = getSecondFromFormatTime(hhmmssxxx) * 1000;
        sceneList.push(milisec);
        addTickMark(document.getElementById('sceneListMarks'), milisec / (duration * 1000) * 1000);
    }
}

function getNextScene(elem, next_step) {
    var milisec = getSecondFromFormatTime(elem.value) * 1000;
    var base_index, next_index;

    for (var base_index=0; base_index<sceneList.length; base_index++) {
        if (milisec <= sceneList[base_index]) {
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
function changeTime(elemTimeSec, elemSeekBar) {
    var seekPoint = duration * elemSeekBar.value; // 本来ならばmaxで割った後にミリ秒にする為に1000を掛けるが、maxは1000のため省略
    elemTimeSec.value = getFormatTimeFromSecond(seekPoint);
    reloadImage();
}

// 時間の値が変更された時にシークバーを動かす処理
function moveSeekPosition(elemSeekBar, elemTimeSec) {
    var seekPoint = getSecondFromFormatTime(elemTimeSec.value) / duration * 1000;
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
        moveSeekPosition(document.f1.seekFrom, document.f1.selectedTime);
        reloadImage();
        document.f1.btnApply.disabled = false;
    }
}

function addTickMark(elem, value) {
    var option = document.createElement('option');
    option.setAttribute('value', value);
    //option.setAttribute('label', "1"); // not support
    elem.appendChild(option);
}
