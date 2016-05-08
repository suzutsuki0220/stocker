// 隠している部分を表示する
function showElem(fElem, checkbox) {
    if (checkbox.checked == true) {
        fElem.style.display = "block";
    } else {
        fElem.style.display = "none";
    }
}

// 比率を表示する
function print_aspect(location) {
    if (location == "crop") {
        var aspect = get_video_aspect(document.enc_setting.crop_w.value, document.enc_setting.crop_h.value);
        document.getElementById('crop_aspect').innerHTML = aspect;
        return;
    }
    if (location == "padding") {
        var aspect = get_video_aspect(document.enc_setting.pad_w.value, document.enc_setting.pad_h.value);
        document.getElementById('padding_aspect').innerHTML = aspect;
        return;
    }
    if (location == "ssize") {
        var aspect = get_video_aspect(document.enc_setting.s_w.value, document.enc_setting.s_h.value);
        document.getElementById('s_aspect').innerHTML = aspect;
        return;
    }
}

function get_ratio(a,b) {
    if (isNaN(a) || isNaN(b)) {
        return 0;
    }
    if (a == 0 || b == 0) {
        return 0;
    }

    while (a != b) {
        if (a > b) {
            r = a - b;
            a = b;
            b = r;
        } else {
            r = b - a;
            b = r;
        }
        if (a <= 0 || b <= 0) {
            return 0;
        }
    }
    return a;
}

// 表示比率を求める
function get_video_aspect(width, height) {
    var x_ratio = 1;
    var y_ratio = 1;
    var vid_ratio = get_ratio(width, height);
    if(vid_ratio != 0) {
        x_ratio = width / vid_ratio;
        y_ratio = height / vid_ratio;
        return x_ratio + ":" + y_ratio;
    } else {
        return "-----";
    }
}

// 解像度とfpsから最適なビットレートを計算する
function calcBitrateAim() {
    // aimed bitrate calcurate from BPP (http://service.jp.real.com/help/faq/prod/faq_4226.html)
    var high_bit = 0;
    var low_bit  = 0;
    var width  = document.enc_setting.s_w.value;
    var height = document.enc_setting.s_h.value;
    var fps    = document.enc_setting.r.value;
    if( document.enc_setting.move_freq[0].checked == true ) {
        // freq high
        high_bit = Math.round(width * height * fps * 0.225 / 1000);
        low_bit  = Math.round(width * height * fps * 0.125 / 1000);
    } else if( document.enc_setting.move_freq[1].checked == true ) {
        // freq middle;
        high_bit = Math.round(width * height * fps * 0.200 / 1000);
        low_bit  = Math.round(width * height * fps * 0.100 / 1000);
    } else if( document.enc_setting.move_freq[2].checked == true ) {
        // freq low
        high_bit = Math.round(width * height * fps * 0.175 / 1000);
        low_bit  = Math.round(width * height * fps * 0.075 / 1000);
    }
    document.getElementById('aimed_bitrate').innerHTML = high_bit + "～" + low_bit + " kbps";
}

function select_existdir() {
    fillFolderName(document.enc_setting.exist_dir.value);
}

function preview_img(ss) {
    var url = get_preview_url(ss, 640);
    window.open(url, 'preview', 'width=640, height=500, menubar=no, scrollbar=yes');
}


/*** 画質調整 ***/

function adjust_preview() {
    var ss = document.enc_setting.ss.value;
    var url = get_preview_url(ss, 320);
    document.adjpreview.src = url;
}

function adj_brightness(gain) {
    var num = (((parseFloat(document.enc_setting.brightness.value)*1000) + (gain*1000)) / 1000);
    document.enc_setting.brightness.value = num;
    if(vaildate_adjustment()) {
        adjust_preview();
    }
}

function set_brightness(value) {
    document.enc_setting.brightness.value = value;
    if(vaildate_adjustment()) {
        adjust_preview();
    }
}

function adj_contrast(gain) {
    var num = (((parseFloat(document.enc_setting.contrast.value)*1000) + (gain*1000)) / 1000);
    document.enc_setting.contrast.value = num;
    if(vaildate_adjustment()) {
        adjust_preview();
    }
}

function set_contrast(num) {
    document.enc_setting.contrast.value = num;
    if(vaildate_adjustment()) {
        adjust_preview();
    }
}

function adj_gamma(gain) {
    var num = (((parseFloat(document.enc_setting.gamma.value)*1000) + (gain*1000)) / 1000);
    document.enc_setting.gamma.value = num;
    if(vaildate_adjustment()) {
        adjust_preview();
    }
}

function set_gamma(num) {
    document.enc_setting.gamma.value = num;
    if(vaildate_adjustment()) {
        adjust_preview();
    }
}

function adj_hue(gain) {
    var num = (((parseFloat(document.enc_setting.hue.value)*1000) + (gain*1000)) / 1000);
    document.enc_setting.hue.value = num;
    if(vaildate_adjustment()) {
        adjust_preview();
    }
}

function set_hue(num) {
    document.enc_setting.hue.value = num;
    if(vaildate_adjustment()) {
        adjust_preview();
    }
}

function adj_saturation(gain) {
    var num = (((parseFloat(document.enc_setting.saturation.value)*1000) + (gain*1000)) / 1000);
    document.enc_setting.saturation.value = num;
    if(vaildate_adjustment()) {
        adjust_preview();
    }
}

function set_saturation(num) {
    document.enc_setting.saturation.value = num;
    if(vaildate_adjustment()) {
        adjust_preview();
    }
}

function adj_sharp(gain) {
    var num = (((parseFloat(document.enc_setting.sharp.value)*1000) + (gain*1000)) / 1000);
    document.enc_setting.sharp.value = num;
    if(vaildate_adjustment()) {
        adjust_preview();
    }
}

function set_sharp(num) {
    document.enc_setting.sharp.value = num;
    if(vaildate_adjustment()) {
        adjust_preview();
    }
}

function adj_rg(gain) {
    var num = (((parseFloat(document.enc_setting.rg.value)*1000) + (gain*1000)) / 1000);
    document.enc_setting.rg.value = num;
    if(vaildate_adjustment()) {
        adjust_preview();
    }
}

function set_rg(num) {
    document.enc_setting.rg.value = num;
    if(vaildate_adjustment()) {
        adjust_preview();
    }
}

function adj_gg(gain) {
    var num = (((parseFloat(document.enc_setting.gg.value)*1000) + (gain*1000)) / 1000);
    document.enc_setting.gg.value = num;
    if(vaildate_adjustment()) {
        adjust_preview();
    }
}

function set_gg(num) {
    document.enc_setting.gg.value = num;
    if(vaildate_adjustment()) {
        adjust_preview();
    }
}

function adj_bg(gain) {
    var num = (((parseFloat(document.enc_setting.bg.value)*1000) + (gain*1000)) / 1000);
    document.enc_setting.bg.value = num;
    if(vaildate_adjustment()) {
        adjust_preview();
    }
}

function set_bg(num) {
    document.enc_setting.bg.value = num;
    if(vaildate_adjustment()) {
        adjust_preview();
    }
}

function adj_weight(gain) {
    var num = (((parseFloat(document.enc_setting.weight.value)*1000) + (gain*1000)) / 1000);
    document.enc_setting.weight.value = num;
    if(vaildate_adjustment()) {
        adjust_preview();
    }
}

function set_weight(num) {
    document.enc_setting.weight.value = num;
    if(vaildate_adjustment()) {
        adjust_preview();
    }
}

function vaildate_adjustment() {
    if (document.enc_setting.brightness.value > 1.0) {
        document.enc_setting.brightness.value = 1.0;
        alert('明るさが大きすぎます。(最大値: 1.0)');
        return false;
    }
    if (document.enc_setting.brightness.value < -1.0) {
        document.enc_setting.brightness.value = -1.0;
        alert('明るさが小さすぎます。(最小値: -1.0)');
        return false;
    }
    if (document.enc_setting.contrast.value > 2.0) {
        document.enc_setting.contrast.value = 2.0;
        alert('コントラストが大きすぎます。(最大値: 2)');
        return false;
    }
    if (document.enc_setting.contrast.value < -2.0) {
        document.enc_setting.contrast.value = -2.0;
        alert('コントラストが小さすぎます。(最小値: -2)');
        return false;
    }
    if (document.enc_setting.gamma.value > 10) {
        document.enc_setting.gamma.value = 10;
        alert('ガンマが大きすぎます。(最大値: 10)');
        return false;
    }
    if (document.enc_setting.gamma.value < 0.1) {
        document.enc_setting.gamma.value = 0.1;
        alert('ガンマが小さすぎます。(最小値: 0.1)');
        return false;
    }
    if (document.enc_setting.hue.value > 180) {
        document.enc_setting.hue.value = 180;
        alert('色相が大きすぎます。(最大値: 180)');
        return false;
    }
    if (document.enc_setting.hue.value < -180) {
        document.enc_setting.hue.value = -180;
        alert('色相が小さすぎます。(最小値: -180)');
        return false;
    }
    if (document.enc_setting.saturation.value > 10) {
        document.enc_setting.saturation.value = 10;
        alert('彩度が大きすぎます。(最大値: 10)');
        return false;
    }
    if (document.enc_setting.saturation.value < -10) {
        document.enc_setting.saturation.value = -10;
        alert('彩度が小さすぎます。(最小値: -10)');
        return false;
    }
    if (document.enc_setting.sharp.value > 1.5) {
        document.enc_setting.sharp.value = 1.5;
        alert('シャープが大きすぎます。(最大値: 1.5)');
        return false;
    }
    if (document.enc_setting.sharp.value < -1.5) {
        document.enc_setting.sharp.value = -1.5;
        alert('シャープが小さすぎます。(最小値: -1.5)');
        return false;
    }
    if (document.enc_setting.rg.value > 10) {
        document.enc_setting.rg.value = 10;
        alert('赤ガンマが大きすぎます。(最大値: 10)');
        return false;
    }
    if (document.enc_setting.rg.value < 0.1) {
        document.enc_setting.rg.value = 0.1;
        alert('赤ガンマが小さすぎます。(最小値: 0.1)');
        return false;
    }
    if (document.enc_setting.gg.value > 10) {
        document.enc_setting.gg.value = 10;
        alert('緑ガンマが大きすぎます。(最大値: 10)');
        return false;
    }
    if (document.enc_setting.gg.value < 0.1) {
        document.enc_setting.gg.value = 0.1;
        alert('緑ガンマが小さすぎます。(最小値: 0.1)');
        return false;
    }
    if (document.enc_setting.bg.value > 10) {
        document.enc_setting.bg.value = 10;
        alert('青ガンマが大きすぎます。(最大値: 10)');
        return false;
    }
    if (document.enc_setting.bg.value < 0.1) {
        document.enc_setting.bg.value = 0.1;
        alert('青ガンマが小さすぎます。(最小値: 0.1)');
        return false;
    }
    if (document.enc_setting.weight.value > 1) {
        document.enc_setting.weight.value = 1;
        alert('weightが大きすぎます。(最大値: 1)');
        return false;
    }
    if (document.enc_setting.weight.value < 0) {
        document.enc_setting.weight.value = 0;
        alert('weightが小さすぎます。(最小値: 0)');
        return false;
    }

    return true;
}

// 開始時と長さを足して終了時を求める
function add_ss_and_t() {
    var array_ss = document.enc_setting.ss.value.split(":", 3);
    var array_t  = document.enc_setting.t.value.split(":", 3);

    var ss_total = parseFloat((array_ss[0]*3600) + (array_ss[1]*60)) + parseFloat(array_ss[2]);
    var t_total  = parseFloat((array_t[0]*3600)  + (array_t[1]*60))  + parseFloat(array_t[2]);

    var total = ((parseFloat(ss_total)*1000) + (parseFloat(t_total)*1000)) / 1000;

    var total_hour = Math.floor(total / 3600);
    var total_min  = Math.floor((total - (total_hour*3600)) / 60);
    var total_sec  = total - (total_hour*3600) - (total_min*60);

    if (total_hour < 10) { total_hour = "0" + total_hour; }
    if (total_min  < 10) { total_min  = "0" + total_min; }
    if (total_sec  < 10) { total_sec  = "0" + total_sec; }

    return total_hour + ":" + total_min + ":" + total_sec;
}

// 開始時と終了時から長さを求める
function calculateT(ss, te) {
    var array_ss = ss.split(":", 3);
    var array_te = te.split(":", 3);

    var ss_total = (array_ss[0]*3600000) + (array_ss[1]*60000) + (array_ss[2]*1000);
    var te_total = (array_te[0]*3600000) + (array_te[1]*60000) + (array_te[2]*1000);

    var length = te_total - ss_total;

    var len_hour = Math.floor(length / 3600000);
    var len_min  = Math.floor((length - (len_hour*3600000)) / 60000);
    var len_sec  = (length - (len_hour*3600000) - (len_min*60000)) / 1000;

    if (len_hour < 10) { len_hour = "0" + len_hour; }
    if (len_min  < 10) { len_min  = "0" + len_min; }
    if (len_sec  < 10) { len_sec  = "0" + len_sec; }

    return len_hour + ":" + len_min + ":" + len_sec;
}
