function getRadioButtonValue(elem) {
    var ret = "";

    if (elem.length) {
        for (var i=0; i<elem.length; i++) {
            if (elem[i].checked) {
                ret = elem[i].value;
            }
        }
    } else {
      if (elem.checked) {
          ret = elem.value;
      }
    }

    return ret;
}

function setFormValues(items) {
    const keys = Object.keys(items);
    for (var i=0; i<keys.length; i++) {
        const k = keys[i];
        const e = document.getElementsByName(k)[0];
        if (e) {
            e.value = items[k];
        }
    }
}

function setPreviewSize(element, disp_width, disp_height) {
    const preview_width  = element.clientWidth;
    const preview_height = Math.floor(preview_width / disp_width * disp_height);

    if (preview_width > 0 && preview_height > 0) {
        element.style.width  = String(preview_width)  + "px";
        element.style.height = String(preview_height) + "px";
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

function getFormatTimeFromSecond(milisec) {
    var hour = Math.floor(milisec / 3600000);
    var min  = Math.floor((milisec - hour * 3600000) / 60000);
    var sec  = Math.floor(((milisec - hour * 3600000) - (min * 60000)) / 1000);
    var mili = milisec - hour * 3600000 - min * 60000 - sec * 1000;

    return jsUtils.datetime.getFormatTime(hour, min, sec, mili);
}

function getSecondFromFormatTime(format_time) {
    const hhmmssxxx_pattern =  /([0-9]+):([0-9][0-9]):([0-9][0-9].[0-9]+)/;
    var hhmmssxxx = hhmmssxxx_pattern.exec(format_time);
    var hh = 0;
    var mm = 0;
    var ss = 0;

    if (hhmmssxxx !== null) {
        hh = parseFloat(hhmmssxxx[1]);
        mm = parseFloat(hhmmssxxx[2]);
        ss = parseFloat(hhmmssxxx[3]);
    }

    return 3600 * hh + 60 * mm + ss;
}

// 開始時と終了時から長さを求める
function getEncTimeDuration(ss, te) {
    var array_ss = ss.split(":", 3);
    var array_te = te.split(":", 3);

    var ss_total = (array_ss[0]*3600000) + (array_ss[1]*60000) + (array_ss[2]*1000);
    var te_total = (array_te[0]*3600000) + (array_te[1]*60000) + (array_te[2]*1000);

    return te_total - ss_total;
}
