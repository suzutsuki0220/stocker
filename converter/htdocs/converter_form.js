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
    var best_video_index = NaN;
    var best_video_width  = 640;
    var best_video_height = 480;
    var best_audio_index = NaN;

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
                best_video_index = getBestVideoStream(videos);
                best_video_width  = parseInt(getXmlFirstFindTagData(videos[best_video_index].childNodes, 'disp_width'));
                best_video_height = parseInt(getXmlFirstFindTagData(videos[best_video_index].childNodes, 'disp_height'));

                for (var i=0; i<audios.length; i++) {
                    if (i === 0) {
                        audio_table += "<tr><th colspan=\"3\">音声ストリーム</th></tr>";
                    }
                    audio_table += makeAudioTable(audios[i].childNodes);
                }
                best_audio_index = isNaN(best_video_index) ? getBestAudioStream(audios) : getNearestAudioStream(audios, videos, best_video_index);

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

        // check radio button
        if (isNaN(best_video_index) === false) {
            document.getElementsByName('v_map')[best_video_index].checked = true;
            setPreviewSize(document.getElementsByName('vimg')[0], best_video_width, best_video_height);
        }
        if (isNaN(best_audio_index) === false) {
            document.getElementsByName('a_map')[best_audio_index].checked = true;
        }
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

function getBestVideoStream(videos) {
    var ret_index = 0;
    var max_pixel_dimension = 0;
    var max_fps = NaN;
    var max_bitrate = NaN;
    var max_pixel_streams = new Array();

    // 最も大きい解像度のストリームを探す
    for (var i=0; i<videos.length; i++) {
        const video_elem = videos[i].childNodes;
        const vid_width  = parseInt(getXmlFirstFindTagData(video_elem, 'width'));
        const vid_height = parseInt(getXmlFirstFindTagData(video_elem, 'height'));
        const pixel_dimension = vid_width * vid_height;

        if (max_pixel_dimension < pixel_dimension) {
            max_pixel_dimension = pixel_dimension;
        }
    }

    // 最大解像度と同じストリームが複数ある場合を想定してインデックスを保持する
    for (var i=0; i<videos.length; i++) {
        const video_elem = videos[i].childNodes;
        const vid_width   = parseInt(getXmlFirstFindTagData(video_elem, 'width'));
        const vid_height  = parseInt(getXmlFirstFindTagData(video_elem, 'height'));
        const pixel_dimension = vid_width * vid_height;

        if (max_pixel_dimension === pixel_dimension) {
            max_pixel_streams.push(i);
        }
    }

    // 最も大きい解像度のストリームの中から最もfpsが高いストリームを探す
    for (var i=0; i< max_pixel_streams.length; i++) {
        const video_elem = videos[max_pixel_streams[i]].childNodes;
        const vid_fps = parseInt(getXmlFirstFindTagData(video_elem, 'fps'));
        if (isNaN(vid_fps) === false) {
            if (isNaN(max_fps) === true) {
                max_fps = vid_fps;
            } else {
                if (max_fps < vid_fps) {
                    max_fps = vid_fps;
                }
            }
        }
    }

    // 更にビットレートで比較
    for (var i=0; i< max_pixel_streams.length; i++) {
        const video_elem  = videos[max_pixel_streams[i]].childNodes;
        const vid_fps     = parseInt(getXmlFirstFindTagData(video_elem, 'fps'));
        const vid_bitrate = parseInt(getXmlFirstFindTagData(video_elem, 'bitrate'));

        if (isNaN(max_fps) === true || vid_fps === max_fps) {
            if (isNaN(vid_bitrate) === false && vid_bitrate !== 0) {
                if (isNaN(max_bitrate) === true) {
                    max_bitrate = vid_bitrate;
                    ret_index = max_pixel_streams[i];
                } else {
                    if (max_bitrate < vid_bitrate) {
                        max_bitrate = vid_bitrate;
                        ret_index = max_pixel_streams[i];
                    }
                }
            } else {
                ret_index = max_pixel_streams[i];
            }
        }
    }

    return ret_index;
}

function getNearestAudioStream(audios, videos, best_video_index) {
    var best_video_no = parseInt(getXmlFirstFindTagData(videos[best_video_index].childNodes, 'no'));

    for (var i=0; i<audios.length; i++) {
        const audio_elem = audios[i].childNodes;
        const aud_no = parseInt(getXmlFirstFindTagData(audio_elem, 'no'));
        if ((best_video_no > 0 && best_video_no -1 === aud_no) || best_video_no + 1 === aud_no) {
            return i;
        }
    }

    return 0;
}

function getBestAudioStream(audios) {
    var ret_index = 0;
    var max_channel = 0;
    var max_sample_rate = NaN;
    var max_bitrate = NaN;
    var max_channel_streams = new Array();

    for (var i=0; i<audios.length; i++) {
        const audio_elem = audios[i].childNodes;
        const aud_channel = parseInt(getXmlFirstFindTagData(audio_elem, 'channel'));
        if (max_channel < aud_channel) {
            max_channel = aud_channel;
        }
    }

    for (var i=0; i<audios.length; i++) {
        const audio_elem = audios[i].childNodes;
        const aud_channel = parseInt(getXmlFirstFindTagData(audio_elem, 'channel'));

        if (max_channel === aud_channel) {
            max_channel_streams.push(i);
        }
    }

    for (var i=0; i<max_channel_streams.length; i++) {
        const audio_elem = audios[max_channel_streams[i]].childNodes;
        const aud_sample_rate = parseInt(getXmlFirstFindTagData(audio_elem, 'sample_rate'));

        if (isNaN(aud_sample_rate) === false) {
            if (isNaN(max_sample_rate) === true) {
                max_sample_rate = aud_sample_rate;
            } else {
                if (max_sample_rate < aud_sample_rate) {
                    max_sample_rate = aud_sample_rate;
                }
            }
        }
    }

    for (var i=0; i<max_channel_streams.length; i++) {
        const audio_elem = audios[max_channel_streams[i]].childNodes;
        const aud_sample_rate = parseInt(getXmlFirstFindTagData(audio_elem, 'sample_rate'));
        const aud_bitrate     = parseInt(getXmlFirstFindTagData(audio_elem, 'bitrate'));

        if (isNaN(max_sample_rate) === true || max_sample_rate === aud_sample_rate) {
            if (isNaN(aud_bitrate) === false && aud_bitrate !== 0) {
                if (isNaN(max_bitrate) === true) {
                    max_bitrate = aud_bitrate;
                    ret_index = max_channel_streams[i];
                } else {
                    if (max_bitrate < aud_bitrate) {
                        max_bitrate = aud_bitrate;
                        ret_index = max_channel_streams[i];
                    }
                }
            } else {
                ret_index = max_channel_streams[i];
            }
        }
    }

    return ret_index;
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

var timeSelNum = 0;
function addTimeSel() {
    var elm = document.getElementById("TimeSelAddtion");
    var newValue = document.getElementsByName("tend"+timeSelNum)[0].value;  // 一つ上の範囲の終了時間を次の開始時間にする
    timeSelNum++;

    var selectArea = document.createElement("div");
    selectArea.setAttribute("id", "sarea"+timeSelNum);
    var textElem = document.createTextNode("開始位置 ");
    selectArea.appendChild(textElem);
    var ssArea = document.createElement("input");
    ssArea.setAttribute("type", "text");
    ssArea.setAttribute("name", "ss"+timeSelNum);
    ssArea.setAttribute("value", newValue);
    ssArea.setAttribute("onClick", "openTimerSelector(this, 'ss"+timeSelNum+"', 'tend"+timeSelNum+"', 't"+timeSelNum+"')");
    selectArea.appendChild(ssArea);
    textElem = document.createTextNode(" (時:分:秒.ミリ秒) ～ ");
    selectArea.appendChild(textElem);
    var tendArea = document.createElement("input");
    tendArea.setAttribute("type", "text");
    tendArea.setAttribute("name", "tend"+timeSelNum);
    tendArea.setAttribute("value", newValue);
    tendArea.setAttribute("onClick", "openTimerSelector(this, 'ss"+timeSelNum+"', 'tend"+timeSelNum+"', 't"+timeSelNum+"')");
    selectArea.appendChild(tendArea);
    textElem = document.createTextNode(" (時:分:秒.ミリ秒) 長さ ");
    selectArea.appendChild(textElem);
    var tArea = document.createElement("input");
    tArea.setAttribute("type", "text");
    tArea.setAttribute("name", "t"+timeSelNum);
    tArea.setAttribute("value", "00:00:00.000");
    tArea.setAttribute("readonly", "true");
    selectArea.appendChild(tArea);
    var delArea = document.createElement("input");
    delArea.setAttribute("type", "button");
    delArea.setAttribute("name", "btnDel"+timeSelNum);
    delArea.setAttribute("value", "削除");
    delArea.setAttribute("onClick", "deleteTimeSel("+timeSelNum+")");
    selectArea.appendChild(delArea);
    elm.appendChild(selectArea);
}

function deleteTimeSel(idx) {
    if (idx <= timeSelNum) {
        var elm = document.getElementById("TimeSelAddtion");
        var i = idx;

        // 間に空いた部分を詰める
        while (i < timeSelNum) {
            var nextIdx = i + 1;
            var nextSs = document.getElementsByName('ss'+nextIdx)[0].value;
            var nextTend = document.getElementsByName('tend'+nextIdx)[0].value;
            var nextT = document.getElementsByName('t'+nextIdx)[0].value;
            document.getElementsByName('ss'+i)[0].value = nextSs;
            document.getElementsByName('tend'+i)[0].value = nextTend;
            document.getElementsByName('t'+i)[0].value = nextT;
            i++;
        }

        // 最後を消す
        var selectArea = document.getElementById("sarea"+timeSelNum);
        elm.removeChild(selectArea);
        timeSelNum--;
    }
}
