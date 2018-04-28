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

function openPreviewWindow() {
    var url = getPreviewUrl(640);
    window.open(url, 'preview', 'width=640, height=500, menubar=no, scrollbar=yes');
}

/*** 画質調整 ***/

function adjust_preview() {
    document.adjpreview.src = getPreviewUrl(320);
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
function getEncTimeDuration(ss, te) {
    var array_ss = ss.split(":", 3);
    var array_te = te.split(":", 3);

    var ss_total = (array_ss[0]*3600000) + (array_ss[1]*60000) + (array_ss[2]*1000);
    var te_total = (array_te[0]*3600000) + (array_te[1]*60000) + (array_te[2]*1000);

    return te_total - ss_total;
}

function getEncTimeString(length) {
    var len_hour = Math.floor(length / 3600000);
    var len_min  = Math.floor((length - (len_hour*3600000)) / 60000);
    var len_sec  = (length - (len_hour*3600000) - (len_min*60000));
    var len_mili = len_sec % 1000;

    len_sec = (len_sec - len_mili) / 1000;

    if (len_hour < 10) { len_hour = "0" + len_hour; }
    if (len_min  < 10) { len_min  = "0" + len_min; }
    if (len_sec  < 10) { len_sec  = "0" + len_sec; }
    if (len_mili < 10) { len_mili = "00" + len_mili; }
    else if (len_mili < 100) { len_mili = "0" + len_mili; }

    return len_hour + ":" + len_min + ":" + len_sec + "." + len_mili;
}

function writeSourceLocation(path)
{
    var html = "";

    if( path.charAt(0) == "/" ) {
        path = path.substr(1,path.length);
    }
    var pathArray = path.split("/");
    for( i=0; i<pathArray.length -1; i++ ) { /* 末尾の"/"の分-1する */
        html += "/ <a href=\"javascript:fillFolderName('" + pathArray[i] + "')\">" + pathArray[i] + "</a>&nbsp;";
    }

    document.getElementById("source_location").innerHTML = html;
}

function fillFolderName(pathText) {
    document.enc_setting.out_dir.value = pathText;
}

function getMovieInfo(movie_info_url, base_name, path) {
    var httpRequest = ajax_init();
    if (httpRequest) {
        var query = "dir=" + base_name + "&file=" + path;
        ajax_set_instance(httpRequest, function() { showInfoTable(httpRequest) });
        ajax_post(httpRequest, movie_info_url, query);
        document.getElementById('information_table').innerHTML = "読み込み中";
    } else {
        document.getElementById('information_table').innerHTML = "動画ファイルの情報取得に失敗しました";
    }
}

function showInfoTable(httpRequest) {
    var content;

    if (httpRequest.readyState == 4) {
        if (httpRequest.status == 200) {
            var data = httpRequest.responseXML;
            var video_table = "";
            var audio_table = "";
            var width, height;

            var movie_info_elem = getXmlFirstFindChildNode(data, 'movie_info');
            if (movie_info_elem !== null) {
                var duration = getXmlFirstFindTagData(movie_info_elem.childNodes, 'duration');
                var filename = getXmlFirstFindTagData(movie_info_elem.childNodes, 'filename');
                var filesize = getXmlFirstFindTagData(movie_info_elem.childNodes, 'filesize');
                var format = getXmlFirstFindTagData(movie_info_elem.childNodes, 'format');

                var videos = movie_info_elem.getElementsByTagName('video');
                var audios = movie_info_elem.getElementsByTagName('audio');

                for (var i=0; i<videos.length; i++) {
                    if (i === 0) {
                        video_table += "<tr><th colspan=\"3\">映像ストリーム</th></tr>";
                    }
                    video_table += makeVideoTable(videos[i].childNodes);
                }
                // TODO: sub get_best_video_stream_id

                for (var i=0; i<audios.length; i++) {
                    if (i === 0) {
                        audio_table += "<tr><th colspan=\"3\">音声ストリーム</th></tr>";
                    }
                    audio_table += makeAudioTable(audios[i].childNodes);
                }
                // TODO: sub get_best_audio_stream_id

                content = `
<table border="3">
<tr><th colspan="3">全般</th></tr>
<tr><th colspan="2">ファイル名</th><td>${filename}</td></tr>
<tr><th colspan="2">ファイルサイズ</th><td>${filesize} Byte</td></tr>
<tr><th colspan="2">時間</th><td>${duration}</td></tr>
<tr><th colspan="2">フォーマット</th><td>${format}</td></tr>
${video_table}
${audio_table}
</table>`;
            } else {
                content = "予期しないデータを受け取りました";
            }
        } else {
            content = "動画情報のパースに失敗しました";
        }
        document.getElementById('information_table').innerHTML = content;
    }
}

function makeVideoTable(video_elem) {
    const vid_no       = getXmlFirstFindTagData(video_elem, 'no');
    const vid_bitrate  = getXmlFirstFindTagData(video_elem, 'bitrate');
    const vid_codec    = getXmlFirstFindTagData(video_elem, 'codec');
    const vid_fps      = getXmlFirstFindTagData(video_elem, 'fps');
    const vid_fps_ave  = getXmlFirstFindTagData(video_elem, 'fps_average');
    const vid_width    = getXmlFirstFindTagData(video_elem, 'width');
    const vid_height   = getXmlFirstFindTagData(video_elem, 'height');
    const disp_width   = getXmlFirstFindTagData(video_elem, 'disp_width');
    const disp_height  = getXmlFirstFindTagData(video_elem, 'disp_height');
    const vid_sar      = getXmlFirstFindTagData(video_elem, 'sar');
    const disp_aspect  = getXmlFirstFindTagData(video_elem, 'disp_aspect');
    const vid_gop_size = getXmlFirstFindTagData(video_elem, 'gop_size');

    var print_average = "";
    if (isNaN(vid_fps_ave) === false) {
        print_average = "(平均 " + vid_fps_ave + ")";
    }

    return `
<tr><td rowspan="6"><input type="radio" name="v_map" value="${vid_no}" onClick="doVideoStreamSelected(${vid_no})">${vid_no}</td>
<th>幅 x 高さ</th><td id="size_${vid_no}">${vid_width} x ${vid_height} (SAR ${vid_sar})</td></tr>
<tr><th>表示上のサイズ</th><td id="disp_${vid_no}">${disp_width} x ${disp_height} (DAR ${disp_aspect})</td></tr>
<tr><th>ビットレート</th><td id="bps_${vid_no}">${vid_bitrate}</td></tr>
<tr><th>コーデック</th><td>${vid_codec}</td></tr>
<tr><th>フレームレート</th><td id="fps_${vid_no}">${vid_fps} ${print_average}</td></tr>
<tr><th>GOP</th><td>${vid_gop_size}</td></tr>
`;
}

function makeAudioTable(audio_elem) {
    const aud_no          = getXmlFirstFindTagData(audio_elem, 'no');
    const aud_sample_rate = getXmlFirstFindTagData(audio_elem, 'sample_rate');
    const aud_channel     = getXmlFirstFindTagData(audio_elem, 'channel');
    const aud_bitrate     = getXmlFirstFindTagData(audio_elem, 'bitrate');
    const aud_bits        = getXmlFirstFindTagData(audio_elem, 'sample_fmt');
    const aud_codec       = getXmlFirstFindTagData(audio_elem, 'codec');

    return `
<tr><td rowspan="5"><input type="radio" name="a_map" value="${aud_no}">${aud_no}</td>
<th>サンプリングレート</th><td>${aud_sample_rate}</td></tr>
<tr><th>チャンネル</th><td>${aud_channel}</td></tr>
<tr><th>ビットレート</th><td>${aud_bitrate}</td></tr>
<tr><th>ビット数</th><td>${aud_bits}</td></tr>
<tr><th>コーデック</th><td>${aud_codec}</td></tr>
`;
}

function doVideoStreamSelected(vid_no) {
    var width, height, disp_width, disp_height, fps;

    var wxh_pattern = /^(\d+)\s*x\s*(\d+).*$/;
    var fps_pattern = /^(\d+).*$/;
    var size_str = document.getElementById("size_" + vid_no).innerHTML;
    var disp_str = document.getElementById("disp_" + vid_no).innerHTML;
    var fps_str  = document.getElementById("fps_" + vid_no).innerHTML;
    var bps  = parseInt(document.getElementById("bps_" + vid_no).innerHTML);

    var wxh_result = wxh_pattern.exec(size_str);
    width  = parseInt(wxh_result[1]);
    height = parseInt(wxh_result[2]);

    var disp_wxh_result = wxh_pattern.exec(disp_str);
    disp_width  = parseInt(disp_wxh_result[1]);
    disp_height = parseInt(disp_wxh_result[2]);

    var fps_result = fps_pattern.exec(fps_str);
    fps = parseFloat(fps_result[1]);

    if (bps === 0) {
        bps = Math.floor(width * height * fps * 0.125);
    }

    document.enc_setting.s_w.value = disp_width - (disp_width % 8);
    document.enc_setting.s_h.value = disp_height - (disp_height % 8);
    document.enc_setting.r.value = Math.floor(fps * 100) / 100;  // 少数点第2位以下は捨てる
    document.enc_setting.b.value = Math.floor(bps / 1000);

    document.getElementsByName('vimg')[0].src = getPreviewUrl(640);
    setPreviewSize(document.getElementsByName('vimg')[0], disp_width, disp_height);
}

function setPreviewSize(element, disp_width, disp_height) {
    const preview_width  = 640;
    const preview_height = Math.floor(preview_width / disp_width * disp_height);

    if (preview_width > 0 && preview_height > 0) {
        element.style.width  = String(preview_width)  + "px";
        element.style.height = String(preview_height) + "px";
    }
}

