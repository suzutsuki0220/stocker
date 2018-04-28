var duration = 0; // 動画の長さ(秒)
var loading = false;  // previewの更新多発を抑止するフラグ
var load_again = false;  // preview読み込み中に値が変わって再度読み直しが必要か判断するフラグ

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

    switch(key_code) {
      case 13: // enter
        apply();
        break;
      case 27: // escape
        closeWindow();
        break;
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
        return;
    }

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

function isValidFormatTime(time_str) {
    var hhmmss = time_str.split(":");
    if (hhmmss.length != 3) {
      return false;
    }

    var sss = hhmmss[2].split(".");
    if (sss.length != 2) {
      return false;
    }

    return true;
}

function formatTime(hour, min, sec, mili) {
    hour = ("0" + hour).substr(-2);
    min  = ("0" + min).substr(-2);
    sec  = ("0" + sec).substr(-2);
    mili = ("00" + mili).substr(-3);

    return hour + ":" + min + ":" + sec + "." + mili;
}

function getFormatTimeFromSecond(milisec) {
    var hour = Math.floor(milisec / 3600000);
    var min  = Math.floor((milisec - hour * 3600000) / 60000);
    var sec  = Math.floor(((milisec - hour * 3600000) - (min * 60000)) / 1000);
    var mili = milisec - hour * 3600000 - min * 60000 - sec * 1000;

    return formatTime(hour, min, sec, mili);
}

function getSecondFromFormatTime(format_time) {
    const hhmmssxxx_pattern =  /([0-9][0-9]):([0-9][0-9]):([0-9][0-9].[0-9]{1,})/;
    var hhmmssxxx = hhmmssxxx_pattern.exec(format_time);

    var hh = parseFloat(hhmmssxxx[1]);
    var mm = parseFloat(hhmmssxxx[2]);
    var ss = parseFloat(hhmmssxxx[3]);

    return 3600 * hh + 60 * mm + ss;
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

