/* global jsUtils, stocker, render.bulma */

var selectedVideo = new Object();
var sceneListPath = "";

let params = new Object();
let files = new Array();
let filename, upPath;

const GRAY_PAD = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAAAwCAIAAAAuKetIAAAAQklEQVRo3u3PAQkAAAgDMLV/mie0hSBsDdZJ6rOp5wQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBATuLGnyAnZizub2AAAAAElFTkSuQmCC";

const enc_params = ['a_codec', 'a_option', 'a_convert', 'a_map', 'ab', 'ac', 'ar', 'aspect_denominator', 'aspect_numerator', 'aspect_set', 'b', 'bg', 'brightness', 'contrast', 'crf', 'crop_h', 'crop_w', 'crop_x', 'crop_y', 'cutoff', 'deinterlace', 'deshake', 'enable_adjust', 'enable_crop', 'enable_pad', 'encode_type', 'format', 'gamma', 'gg', 'hue', 'multi_editmode', 'pad_color', 'pad_h', 'pad_w', 'pad_x', 'pad_y', 'pass2', 'preset', 'r', 'rg', 's_h', 's_w', 'saturation', 'set_position', 'sharp', 'v_codec', 'v_option', 'v_convert', 'v_map', 'volume', 'weight'];

const encodeFormats = {
    video: [
        ["mts", "MPEG-TS (MPEG-2 Transport Stream)"],
        ["mp4", "MPEG4 / QuickTime"],
        ["dvd", "DVD-VIDEO (MPEG2)"],
        ["webm", "WebM"],
        ["ogv", "Ogg Video"],
        ["wmv", "Windows Media(WMVv8)"],
        ["asf", "ASF (Advanced / Active Streaming Format)"]
    ],
    audio: [
        ["wav", "WAV / WAVE (Waveform Audio)"],
        ["flac", "raw FLAC (Audio)"],
        ["mp3", "MP3 (MPEG audio layer 3)"],
        ["aac", "raw ADTS AAC (Advanced Audio Coding)"]
    ]
};

window.addEventListener("load", function (event) {
    params = jsUtils.url.getRawParams();
    files = stocker.components.getParamFile();

    if (files.length === 0) {
        render.bulma.elements.notification("error", "ファイルが選択されていません");
    }
    makeMultiEditForm();

    getDirectoryProperties(params.dir, files[0], NaN, NaN, function (data) {
        filename = data.properties.name;
        upPath = data.properties.up_path;

        document.getElementById('fileNameArea').textContent = filename;
        sourceFileList(document.getElementById('source_file_list'));
        getMovieInfo(params.dir, files[0]);
        getSceneListFilePath(filename, params.dir, upPath);
    }, function (e) {
        console.log(e);
    });

    document.getElementById('vimg').src = getPreviewUrl(640);
    document.adjpreview.src = GRAY_PAD;
    //document.getElementById('encodeListLink').href = stockerConfig.uri.converter.list;

    makeDirectorySelector(document.getElementById('destinationSelectorArea'));
});

function setFormOption(options, value) {
    for (let i = 0; i < options.length; i++) {
        if (options[i].value === value) {
            options[i].selected = true;
            return;
        }
    }
}

function resetForm() {
    const form = document.enc_setting;
    form.v_convert[0].checked = true;
    form.a_convert[0].checked = true;

    form.v_option.value = "";
    form.a_option.value = "";

    setFormOption(form.aspect_set.options, "none");
    form.aspect_numerator.value = "";
    form.aspect_denominator.value = "";

    form.pass2.checked = false;
    form.save_aspect.checked = false;
    form.encode_type[0].checked = true;
    setFormOption(form.preset.options, "medium");
    form.crf.value = "";
    form.r.value = "29.97";
    form.deinterlace.checked = true;
}

function presetAudio(bitrate) {
    document.enc_setting.ac[1].checked = true;  // Stereo
    setFormOption(document.enc_setting.ar.options, "");  // Original
    setFormOption(document.enc_setting.ab.options, String(bitrate));
}

function makeMultiEditForm() {
    if (files.length > 1) {
        document.getElementById('multi_edit_form').innerHTML
            = "<p><b>複数のファイルが指定されています</b><br>"
            + "変換方法: "
            + "<input type='radio' name='multi_editmode' value='combine' checked> 複数の動画を結合してエンコード&nbsp;&nbsp;"
            + "<input type='radio' name='multi_editmode' value='sameenc'> 同じ設定でエンコード<br></p>";
    }
}

function makeEncodeQuery() {
    const getNamedValue = function (key) {
        const e = document.getElementsByName(key);
        var v = "";
        if (e && e[0]) {
            if (e[0].type === 'checkbox') {
                v = e[0].checked ? 'true' : 'false';
            } else if (e[0].type === 'radio') {
                for (var i = 0; i < e.length; i++) {
                    if (e[i].checked === true) {
                        v = e[i].value;
                        break;
                    }
                }
            } else {
                v = e[0].value;
            }
        }

        return v;
    };

    let query = "root=" + params.dir;

    for (let i = 0; i < files.length; i++) {
        query += '&path=' + files[i];
    }

    query += "&out_root=" + selectedParam.root + "&out_path=" + selectedParam.path;

    for (let i = 0; i <= timeSelNum; i++) {
        const ss = 'ss' + i;
        const t = 't' + i;

        query += '&' + ss + '=' + getNamedValue(ss);
        query += '&' + t + '=' + getNamedValue(t);
    }

    for (let i = 0; i < enc_params.length; i++) {
        query += '&' + enc_params[i] + '=' + getNamedValue(enc_params[i]);
    }

    return query;
}

function addJob() {
    document.getElementById('sStatus').innerHTML = "登録中...";
    const formUri = jsUtils.url.apart(window.location.href);

    jsUtils.fetch.request(
        {
            uri: '/api/v1/converts',
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: makeEncodeQuery(),
            mode: 'cors',
            method: 'POST',
            format: 'json'
        }, function (data) {
            document.getElementById('sStatus').innerHTML = "変換ジョブを登録しました";
        }, function (error) {
            document.getElementById('sStatus').innerHTML = "ERROR: " + error.message;
        }
    );
}

// 隠している部分を表示する
function showElem(fElem, checkbox) {
    fElem.style.display = checkbox.checked ? "block" : "none";
}

// 比率を表示する
function print_aspect(location) {
    if (location == "crop") {
        let aspect = get_video_aspect(document.enc_setting.crop_w.value, document.enc_setting.crop_h.value);
        document.getElementById('crop_aspect').innerHTML = aspect;
        return;
    }
    if (location == "padding") {
        let aspect = get_video_aspect(document.enc_setting.pad_w.value, document.enc_setting.pad_h.value);
        document.getElementById('padding_aspect').innerHTML = aspect;
        return;
    }
    if (location == "ssize") {
        let aspect = get_video_aspect(document.enc_setting.s_w.value, document.enc_setting.s_h.value);
        document.getElementById('s_aspect').innerHTML = aspect;
        return;
    }
}

// 表示比率を求める
function get_video_aspect(width, height) {
    const ratio = jsUtils.image.getAspect({ width: width, height: height });

    return ratio ? ratio.x + ":" + ratio.y : "-----";
}

function checkSize(elem) {
    if (elem.length === 0 || elem.value <= 10) {
        alert('解像度が小さすぎます');
        return false;
    }
    if (elem.value % 8 !== 0) {
        alert('解像度は8の倍数にして下さい。');
        return false;
    }

    return true;
}

function fixHeight() {
    if (checkSize(document.enc_setting.s_w)) {
        if (document.enc_setting.save_aspect.checked == true) {
            document.enc_setting.s_h.value = Math.round(document.enc_setting.s_w.value / selectedVideo.ratio.x * selectedVideo.ratio.y);
        }
        print_aspect('ssize');
    }
}

function fixWidth() {
    if (checkSize(document.enc_setting.s_h)) {
        if (document.enc_setting.save_aspect.checked == true) {
            document.enc_setting.s_w.value = Math.round(document.enc_setting.s_h.value / selectedVideo.ratio.y * selectedVideo.ratio.x);
        }
        print_aspect('ssize');
    }
}

// 解像度とfpsから最適なビットレートを計算する
function calcBitrateAim() {
    // aimed bitrate calcurate from BPP (http://service.jp.real.com/help/faq/prod/faq_4226.html)
    var high_bit = 0;
    var low_bit = 0;
    var width = document.enc_setting.s_w.value;
    var height = document.enc_setting.s_h.value;
    var fps = document.enc_setting.r.value;
    if (document.enc_setting.move_freq[0].checked == true) {
        // freq high
        high_bit = Math.round(width * height * fps * 0.225 / 1000);
        low_bit = Math.round(width * height * fps * 0.125 / 1000);
    } else if (document.enc_setting.move_freq[1].checked == true) {
        // freq middle;
        high_bit = Math.round(width * height * fps * 0.200 / 1000);
        low_bit = Math.round(width * height * fps * 0.100 / 1000);
    } else if (document.enc_setting.move_freq[2].checked == true) {
        // freq low
        high_bit = Math.round(width * height * fps * 0.175 / 1000);
        low_bit = Math.round(width * height * fps * 0.075 / 1000);
    }
    document.getElementById('aimed_bitrate').innerHTML = high_bit + "～" + low_bit + " kbps";
}

function openPreviewWindow() {
    var url = getPreviewUrl(640);
    window.open(url, 'preview', 'width=640, height=500, menubar=no, scrollbar=yes');
}

function getPreviewUrl(width) {
    let url = '/api/v1/media/' + params.dir + "/" + files[0] + "/videoimage?size=" + width;
    if (document.enc_setting.v_map && document.enc_setting.v_map.length !== 0) {
        url += "&v_map=" + getRadioButtonValue(document.enc_setting.v_map);
    }
    if (document.enc_setting.set_position.checked == true) {
        url += "&set_position=1";
        url += "&ss=" + document.enc_setting.ss0.value;
    }
    if (document.enc_setting.enable_crop.checked == true) {
        url += "&enable_crop=1";
        url += "&crop_w=" + document.enc_setting.crop_w.value;
        url += "&crop_h=" + document.enc_setting.crop_h.value;
        url += "&crop_x=" + document.enc_setting.crop_x.value;
        url += "&crop_y=" + document.enc_setting.crop_y.value;
    }
    if (document.enc_setting.enable_pad.checked == true) {
        url += "&enable_pad=1";
        url += "&pad_w=" + document.enc_setting.pad_w.value;
        url += "&pad_h=" + document.enc_setting.pad_h.value;
        url += "&pad_x=" + document.enc_setting.pad_x.value;
        url += "&pad_y=" + document.enc_setting.pad_y.value;
        url += "&pad_color=" + document.enc_setting.pad_color.value;
    }
    if (document.enc_setting.enable_adjust.checked == true) {
        url += "&enable_adjust=1";
        url += "&brightness=" + document.enc_setting.brightness.value;
        url += "&contrast=" + document.enc_setting.contrast.value;
        url += "&gamma=" + document.enc_setting.gamma.value;
        url += "&hue=" + document.enc_setting.hue.value;
        url += "&saturation=" + document.enc_setting.saturation.value;
        url += "&sharp=" + document.enc_setting.sharp.value;
        url += "&rg=" + document.enc_setting.rg.value;
        url += "&gg=" + document.enc_setting.gg.value;
        url += "&bg=" + document.enc_setting.bg.value;
        url += "&weight=" + document.enc_setting.weight.value;
    }
    return url;
}

function actionAdjEnable() {  // 画質調整する のチェックボックス
    if (document.enc_setting.enable_adjust.checked == true) {
        adjust_preview();
    } else {
        document.adjpreview.src = GRAY_PAD;
    }
}

/*** 画質調整 ***/

function adjust_preview() {
    document.adjpreview.src = getPreviewUrl(320);
}

function adj_brightness(gain) {
    var num = (((parseFloat(document.enc_setting.brightness.value) * 1000) + (gain * 1000)) / 1000);
    document.enc_setting.brightness.value = num;
    if (vaildate_adjustment()) {
        adjust_preview();
    }
}

function set_brightness(value) {
    document.enc_setting.brightness.value = value;
    if (vaildate_adjustment()) {
        adjust_preview();
    }
}

function adj_contrast(gain) {
    var num = (((parseFloat(document.enc_setting.contrast.value) * 1000) + (gain * 1000)) / 1000);
    document.enc_setting.contrast.value = num;
    if (vaildate_adjustment()) {
        adjust_preview();
    }
}

function set_contrast(num) {
    document.enc_setting.contrast.value = num;
    if (vaildate_adjustment()) {
        adjust_preview();
    }
}

function adj_gamma(gain) {
    var num = (((parseFloat(document.enc_setting.gamma.value) * 1000) + (gain * 1000)) / 1000);
    document.enc_setting.gamma.value = num;
    if (vaildate_adjustment()) {
        adjust_preview();
    }
}

function set_gamma(num) {
    document.enc_setting.gamma.value = num;
    if (vaildate_adjustment()) {
        adjust_preview();
    }
}

function adj_hue(gain) {
    var num = (((parseFloat(document.enc_setting.hue.value) * 1000) + (gain * 1000)) / 1000);
    document.enc_setting.hue.value = num;
    if (vaildate_adjustment()) {
        adjust_preview();
    }
}

function set_hue(num) {
    document.enc_setting.hue.value = num;
    if (vaildate_adjustment()) {
        adjust_preview();
    }
}

function adj_saturation(gain) {
    var num = (((parseFloat(document.enc_setting.saturation.value) * 1000) + (gain * 1000)) / 1000);
    document.enc_setting.saturation.value = num;
    if (vaildate_adjustment()) {
        adjust_preview();
    }
}

function set_saturation(num) {
    document.enc_setting.saturation.value = num;
    if (vaildate_adjustment()) {
        adjust_preview();
    }
}

function adj_sharp(gain) {
    var num = (((parseFloat(document.enc_setting.sharp.value) * 1000) + (gain * 1000)) / 1000);
    document.enc_setting.sharp.value = num;
    if (vaildate_adjustment()) {
        adjust_preview();
    }
}

function set_sharp(num) {
    document.enc_setting.sharp.value = num;
    if (vaildate_adjustment()) {
        adjust_preview();
    }
}

function adj_rg(gain) {
    var num = (((parseFloat(document.enc_setting.rg.value) * 1000) + (gain * 1000)) / 1000);
    document.enc_setting.rg.value = num;
    if (vaildate_adjustment()) {
        adjust_preview();
    }
}

function set_rg(num) {
    document.enc_setting.rg.value = num;
    if (vaildate_adjustment()) {
        adjust_preview();
    }
}

function adj_gg(gain) {
    var num = (((parseFloat(document.enc_setting.gg.value) * 1000) + (gain * 1000)) / 1000);
    document.enc_setting.gg.value = num;
    if (vaildate_adjustment()) {
        adjust_preview();
    }
}

function set_gg(num) {
    document.enc_setting.gg.value = num;
    if (vaildate_adjustment()) {
        adjust_preview();
    }
}

function adj_bg(gain) {
    var num = (((parseFloat(document.enc_setting.bg.value) * 1000) + (gain * 1000)) / 1000);
    document.enc_setting.bg.value = num;
    if (vaildate_adjustment()) {
        adjust_preview();
    }
}

function set_bg(num) {
    document.enc_setting.bg.value = num;
    if (vaildate_adjustment()) {
        adjust_preview();
    }
}

function adj_weight(gain) {
    var num = (((parseFloat(document.enc_setting.weight.value) * 1000) + (gain * 1000)) / 1000);
    document.enc_setting.weight.value = num;
    if (vaildate_adjustment()) {
        adjust_preview();
    }
}

function set_weight(num) {
    document.enc_setting.weight.value = num;
    if (vaildate_adjustment()) {
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

function getSceneListFilePath(file_name, root, dirpath) {
    const list_file = jsUtils.file.getNameFromPath(file_name).filename + '.vdr';
    sceneListPath = "";

    jsUtils.fetch.request({
        uri: '/api/v1/storage/' + root + '/' + dirpath + '/properties',
        method: 'GET',
        format: 'json'
    }, function (json) {
        for (const e of json.elements) {
            if (e.type === 'FILE' && e.name === list_file) {
                sceneListPath = e.path;
                break;
            }
        }
    });
}

function getMovieInfo(root, path) {
    document.getElementById('information_table').innerHTML = "読み込み中";

    jsUtils.fetch.request({
        uri: '/api/v1/media/' + root + '/' + path + '/movieInfo',
        method: 'GET',
        format: 'json'
    }, showInfoTable, function () {
        render.bulma.elements.notification("error", "動画ファイルの情報取得に失敗しました");
    });
}

function showInfoTable(data) {
    var video_table = "";
    var audio_table = "";

    for (const st of data.streams) {
        if (st.type === 'video') {
            if (video_table.length === 0) {
                video_table += "<tr><th colspan=\"3\">映像ストリーム</th></tr>";
            }
            video_table += makeVideoTable(st);
        } else if (st.type === 'audio') {
            if (audio_table.length === 0) {
                audio_table += "<tr><th colspan=\"3\">音声ストリーム</th></tr>";
            }
            audio_table += makeAudioTable(st);
        }
    }

    document.getElementById('information_table').innerHTML
        = "<table border=\"3\">"
        + "<tr><th colspan=\"3\">全般</th></tr>"
        + "<tr><th colspan=\"2\">ファイル名</th><td>" + filename + "</td></tr>"
        //        + "<tr><th colspan=\"2\">ファイルサイズ</th><td>" + "properties.filesize" + " Byte</td></tr>"
        + "<tr><th colspan=\"2\">時間</th><td>" + data.duration + "</td></tr>"
        + "<tr><th colspan=\"2\">フォーマット</th><td>" + data.format + "</td></tr>"
        + video_table + audio_table + "</table>";

    const best_stream = getBestStream(data.streams);

    // check radio button
    if (isNaN(best_stream.video.index) === false) {
        document.getElementsByName('v_map')[best_stream.video.index].checked = true;
        doVideoStreamSelected(best_stream.video.no);
    }
    if (isNaN(best_stream.audio.index) === false) {
        document.getElementsByName('a_map')[best_stream.audio.index].checked = true;
    }
}

function makeVideoTable(vid) {
    var print_average = "";
    if (isNaN(vid.fps_average) === false) {
        print_average = "(平均 " + vid.fps_average + ")";
    }

    return `
<tr><td rowspan="6"><input type="radio" name="v_map" value="${vid.no}" onClick="doVideoStreamSelected(${vid.no})">${vid.no}</td>
<th>幅 x 高さ</th><td id="size_${vid.no}">${vid.width} x ${vid.height} (SAR ${vid.sar})</td></tr>
<tr><th>表示上のサイズ</th><td id="disp_${vid.no}">${vid.disp_width} x ${vid.disp_height} (DAR ${vid.disp_aspect})</td></tr>
<tr><th>ビットレート</th><td id="bps_${vid.no}">${vid.bitrate}</td></tr>
<tr><th>コーデック</th><td>${vid.codec}</td></tr>
<tr><th>フレームレート</th><td id="fps_${vid.no}">${vid.fps} ${print_average}</td></tr>
<tr><th>GOP</th><td>${vid.gop_size}</td></tr>
`;
}

function makeAudioTable(aud) {
    return `
<tr><td rowspan="5"><input type="radio" name="a_map" value="${aud.no}">${aud.no}</td>
<th>サンプリングレート</th><td>${aud.sample_rate}</td></tr>
<tr><th>チャンネル</th><td>${aud.channel}</td></tr>
<tr><th>ビットレート</th><td>${aud.bitrate}</td></tr>
<tr><th>ビット数</th><td>${aud.sample_fmt}</td></tr>
<tr><th>コーデック</th><td>${aud.codec}</td></tr>
`;
}

function getBestStream(streams) {
    const videos = new Array();
    const audios = new Array();

    for (const st of streams) {
        if (st.type === 'video') {
            videos.push(st);
        } else if (st.type === 'audio') {
            audios.push(st);
        }
    }

    if (videos.length === 0) {
        return {
            video: { no: NaN, index: NaN },
            audio: getBestAudioStream(audios)
        };
    }

    const best_video = getBestVideoStream(videos);
    return {
        video: best_video,
        audio: getNearestAudioStream(audios, best_video.no)
    };
}

function getBestVideoStream(videos) {
    var ret_index = 0;
    var max_pixel_dimension = 0;
    var max_fps = 0;
    var max_bitrate = NaN;
    var max_pixel_streams = new Array();

    // 最も大きい解像度のストリームを探す
    for (var i = 0; i < videos.length; i++) {
        const pixel_dimension = jsUtils.image.getAreaSize(videos[i]);
        if (max_pixel_dimension < pixel_dimension) {
            // 最大解像度が更新された
            max_pixel_dimension = pixel_dimension;
            max_pixel_streams = [i];  // 既に保持しているArrayを消して作り直す
        } else if (max_pixel_dimension === pixel_dimension) {
            // 最大解像度と同じストリームが複数ある場合を想定してインデックスを保持する
            max_pixel_streams.push(i);
        }
    }

    // 最も大きい解像度のストリームの中から最もfpsが高いストリームを探す
    for (var i = 0; i < max_pixel_streams.length; i++) {
        const vid_fps = jsUtils.value.replaceNanToZero(videos[max_pixel_streams[i]].fps);
        if (max_fps < vid_fps) {
            max_fps = vid_fps;
        }
    }

    // 更にビットレートで比較
    for (var i = 0; i < max_pixel_streams.length; i++) {
        const vid_fps = jsUtils.value.replaceNanToZero(videos[max_pixel_streams[i]].fps);
        const vid_bitrate = jsUtils.value.replaceNanToZero(videos[max_pixel_streams[i]].bitrate);

        if (max_fps && vid_fps === max_fps) {
            if (vid_bitrate) {
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

    return {
        index: ret_index,
        no: parseInt(videos[ret_index].no)
    };
}

function getNearestAudioStream(audios, best_video_no) {
    for (var i = 0; i < audios.length; i++) {
        const aud_no = jsUtils.value.replaceNanToZero(audios[i].no);
        if ((best_video_no > 0 && best_video_no - 1 === aud_no) || best_video_no + 1 === aud_no) {
            return { index: i, no: aud_no };
        }
    }

    return { index: 0, no: parseInt(audios[0].no) };
}

function getBestAudioStream(audios) {
    var ret_index = 0;
    var max_channel = 0;
    var max_sample_rate = NaN;
    var max_bitrate = NaN;
    var max_channel_streams = new Array();

    for (var i = 0; i < audios.length; i++) {
        const aud_channel = jsUtils.value.replaceNanToZero(audios[i].channel);
        if (max_channel < aud_channel) {
            max_channel = aud_channel;
        }
    }

    for (var i = 0; i < audios.length; i++) {
        const aud_channel = jsUtils.value.replaceNanToZero(audios[i].channel);
        if (max_channel === aud_channel) {
            max_channel_streams.push(i);
        }
    }

    for (var i = 0; i < max_channel_streams.length; i++) {
        const aud_sample_rate = jsUtils.value.replaceNanToZero(audios[max_channel_streams[i]].sample_rate);
        if (isNaN(max_sample_rate) === true) {
            max_sample_rate = aud_sample_rate;
        } else {
            if (max_sample_rate < aud_sample_rate) {
                max_sample_rate = aud_sample_rate;
            }
        }
    }

    for (var i = 0; i < max_channel_streams.length; i++) {
        const aud_sample_rate = jsUtils.value.replaceNanToZero(audios[max_channel_streams[i]].sample_rate);
        const aud_bitrate = jsUtils.value.replaceNanToZero(audios[max_channel_streams[i]].bitrate);

        if (max_sample_rate === aud_sample_rate) {
            if (aud_bitrate !== 0) {
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

    return {
        index: ret_index,
        no: parseInt(audios[ret_index].no)
    };
}

function doVideoStreamSelected(vid_no) {
    var wxh_pattern = /^(\d+)\s*x\s*(\d+).*$/;
    var size_str = document.getElementById("size_" + vid_no).innerHTML;
    var disp_str = document.getElementById("disp_" + vid_no).innerHTML;
    var fps = parseFloat(document.getElementById("fps_" + vid_no).innerHTML);
    var bps = parseInt(document.getElementById("bps_" + vid_no).innerHTML);

    var wxh_result = wxh_pattern.exec(size_str);
    selectedVideo.width = parseInt(wxh_result[1]);
    selectedVideo.height = parseInt(wxh_result[2]);

    var disp_wxh_result = wxh_pattern.exec(disp_str);
    selectedVideo.disp_width = parseInt(disp_wxh_result[1]);
    selectedVideo.disp_height = parseInt(disp_wxh_result[2]);

    if (bps === 0) {
        bps = Math.floor(selectedVideo.width * selectedVideo.height * fps * 0.125);
    }

    var obj = {
        s_w: selectedVideo.disp_width - (selectedVideo.disp_width % 8),
        s_h: selectedVideo.disp_height - (selectedVideo.disp_height % 8),
        r: jsUtils.value.round(fps, 2),  // 少数点第2位以下は捨てる
        b: Math.floor(bps / 1000)
    };
    setFormValues(obj);

    selectedVideo.ratio = jsUtils.image.getAspect({ width: obj.s_w, height: obj.s_h });
    print_aspect('ssize');

    document.getElementById('vimg').src = getPreviewUrl(640);
    setPreviewSize(document.getElementById('vimg'), selectedVideo.disp_width, selectedVideo.disp_height);
}

function setPresetCrop43() {
    const image = jsUtils.image;

    const disp = {
        width: selectedVideo.disp_width,
        height: selectedVideo.disp_height
    };
    const ratio = jsUtils.image.getAspect(disp);
    const gcd = jsUtils.value.getGcd(disp.width, disp.height);

    const crop_size = {
        width: gcd * 4 * (ratio.y / 3),
        height: disp.height
    };
    const center = image.getCenteringPositionXY(crop_size, disp);

    const disp_stretch_x = selectedVideo.width / disp.width;
    const disp_stretch_y = selectedVideo.height / disp.height;

    var obj = {
        crop_w: crop_size.width * disp_stretch_x,
        crop_h: crop_size.height * disp_stretch_y,
        crop_x: center.x * disp_stretch_x,
        crop_y: center.y * disp_stretch_y
    }
    setFormValues(obj);
}

var timeSelNum = 0;
function addTimeSel() {
    var elm = document.getElementById("TimeSelAddtion");
    var newValue = document.getElementsByName("tend" + timeSelNum)[0].value;  // 一つ上の範囲の終了時間を次の開始時間にする
    timeSelNum++;

    var selectArea = document.createElement("div");
    selectArea.setAttribute("id", "sarea" + timeSelNum);
    var textElem = document.createTextNode(String(timeSelNum + 1) + ".位置 ");
    selectArea.appendChild(textElem);
    var ssArea = document.createElement("input");
    ssArea.setAttribute("type", "text");
    ssArea.setAttribute("name", "ss" + timeSelNum);
    ssArea.setAttribute("class", "hhmmssxxx");
    ssArea.setAttribute("value", newValue);
    ssArea.setAttribute("onClick", "openTimerSelector(this, timeSelNum)");
    selectArea.appendChild(ssArea);
    textElem = document.createTextNode(" ～ ");
    selectArea.appendChild(textElem);
    var tendArea = document.createElement("input");
    tendArea.setAttribute("type", "text");
    tendArea.setAttribute("name", "tend" + timeSelNum);
    tendArea.setAttribute("class", "hhmmssxxx");
    tendArea.setAttribute("value", newValue);
    tendArea.setAttribute("onClick", "openTimerSelector(this, timeSelNum)");
    selectArea.appendChild(tendArea);
    textElem = document.createTextNode(" 長さ");
    selectArea.appendChild(textElem);
    var tArea = document.createElement("input");
    tArea.setAttribute("type", "text");
    tArea.setAttribute("name", "t" + timeSelNum);
    tArea.setAttribute("class", "hhmmssxxx");
    tArea.setAttribute("value", "00:00:00.000");
    tArea.setAttribute("readonly", "true");
    selectArea.appendChild(tArea);
    var delArea = document.createElement("input");
    delArea.setAttribute("type", "button");
    delArea.setAttribute("name", "btnDel" + timeSelNum);
    delArea.setAttribute("value", "削除");
    delArea.setAttribute("onClick", "deleteTimeSel(" + timeSelNum + ")");
    selectArea.appendChild(delArea);
    elm.appendChild(selectArea);
}

function sourceFileList(elem) {
    getDirectoryProperties(params.dir, upPath, NaN, NaN, function (data) {
        const ul = document.createElement('ul');
        data.elements.forEach(function (e) {
            for (const f of files) {
                if (f === e.path) {
                    const li = document.createElement('li');
                    li.innerText = e.name
                    ul.appendChild(li);
                }
            }
        })
        elem.appendChild(ul);
    });
}

function deleteTimeSel(idx) {
    if (idx <= timeSelNum) {
        var elm = document.getElementById("TimeSelAddtion");
        var i = idx;

        // 間に空いた部分を詰める
        while (i < timeSelNum) {
            var nextIdx = i + 1;
            var nextSs = document.getElementsByName('ss' + nextIdx)[0].value;
            var nextTend = document.getElementsByName('tend' + nextIdx)[0].value;
            var nextT = document.getElementsByName('t' + nextIdx)[0].value;
            document.getElementsByName('ss' + i)[0].value = nextSs;
            document.getElementsByName('tend' + i)[0].value = nextTend;
            document.getElementsByName('t' + i)[0].value = nextT;
            i++;
        }

        // 最後を消す
        var selectArea = document.getElementById("sarea" + timeSelNum);
        elm.removeChild(selectArea);
        timeSelNum--;
    }
}
