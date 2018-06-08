#!/usr/bin/perl

use strict;
use warnings;
use utf8;
use Encode;
use CGI;

use lib '%libs_dir%';
use ParamPath;
use HTML_Elem;

our $MOVIEIMG_CGI   = "";
our $MOVIE_INFO_CGI = "";
our $BASE_DIR_CONF  = "";
our $GETFILE_CGI    = "";
require '%conf_dir%/converter.conf';

my $q = eval{new CGI};
my $output;

my @files = ();
my $path;
my $base_name = scalar($q->param('dir'));
my $encoded_dir = HTML_Elem->url_encode(${base_name});
my $encoded_path = scalar($q->param('file'));
eval {
  my $ins = ParamPath->new(base_dir_conf => $BASE_DIR_CONF);
  $ins->init_by_base_name(HTML_Elem->url_decode($base_name));
  $path = decode('utf-8', $ins->urlpath_decode($encoded_path));
};
if ($@) {
  HTML_Elem->header();
  HTML_Elem->error($@);
}

if(! ${encoded_path} || length(${encoded_path}) <= 0 ) {
  HTML_Elem->header();
  HTML_Elem->error("パスが指定されていません。");
}

my @skip_options = (
  ["3600", "60 分"],
  ["1800", "30 分"],
  ["900", "15 分"],
  ["180", "3 分"],
  ["60", "1 分"],
  ["30", "30 秒"],
  ["15", "15 秒"],
  ["5", "5 秒"],
  ["3", "3 秒"],
  ["1", "1 秒"],
  ["0.5", "1/2 秒"],
  ["0.25", "1/4 秒"],
  ["0.125", "1/8 秒"],
  ["0.063", "1/16 秒"],
  ["0.031", "1/32 秒"],
  ["0.001", "1/100 秒"],
);

my @jslist = (
      "%htdocs_root%/converter_common.js",
      "%htdocs_root%/convertselect.js",
      "%htdocs_root%/stocker_xml.js",
      "%htdocs_root%/ajax_html_request.js",
);
my @csslist = (
      "%htdocs_root%/stocker.css",
      "%htdocs_root%/convertselect.css",
);
my $html = HTML_Elem->new();
$html->{'javascript'} = \@jslist;
$html->{'css'} = \@csslist;
$html->header('timer selector');

my $start_pos  = $q->param('start_pos');
my $end_pos    = $q->param('end_pos');
my $clicked    = $q->param('clicked');
my $start_f    = $q->param('start_f');
my $end_f      = $q->param('end_f');
my $duration_f = $q->param('duration_f');
my $ss         = $q->param('ss');
my $tend       = $q->param('tend');
my $vno        = $q->param('vno');

if (!$clicked || !$start_f || !$end_f || !$duration_f) {
    HTML_Elem->error("parameter is not enough");
}

my $GRAY_PAD = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAAAwCAIAAAAuKetIAAAAQklEQVRo3u3PAQkAAAgDMLV/mie0hSBsDdZJ6rOp5wQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBATuLGnyAnZizub2AAAAAElFTkSuQmCC";

$path =~ /(.+?)\.(.*)$/;
my $encoded_scene_path = ParamPath->urlpath_encode(encode('utf-8', $1 . ".vdr"));

$output = <<EOF;
<form action="$ENV{'SCRIPT_NAME'}" method="GET" name="f1" autocomplete="off">
<div class="imageAndTimeArea">
  <div id="startPreviewArea">
    <a href="javascript:switchTimeControl(0)">
    <img src="${GRAY_PAD}" id="previewStart" class="preview">
    </a>
    <div class="PreviewReloading" id="reloadingStart">Reloading...</div>
  </div>
  <div class="timeArea">
    <input type="radio" name="controlTimeSwitch" value="start" onClick="doControlTimeSwitched()" checked>開始位置<br>
    時間: <input type="text" name="selectedTimeStart" size="30" value="${ss}" onInput="changeSelectedTime(this)">
  </div>
</div>
<div class="imageAndTimeArea">
  <div id="endPreviewArea">
    <a href="javascript:switchTimeControl(1)">
    <img src="${GRAY_PAD}" id="previewEnd" class="preview">
    </a>
    <div class="PreviewReloading" id="reloadingEnd">Reloading...</div>
  </div>
  <div class="timeArea">
    <input type="radio" name="controlTimeSwitch" value="end" onClick="doControlTimeSwitched()">終了位置<br>
    時間: <input type="text" name="selectedTimeEnd" size="30" value="${tend}" onInput="changeSelectedTime(this)">
  </div>
</div>
<div style="text-align: center">
<input type="range" name="seekFrom" style="width: 100%" min="0" max="1000" step="1" value="0" list="sceneListMarks" onChange="changeTime(this)">
<datalist id="sceneListMarks"></datalist>
<br>
<div id="sceneSelectArea"></div>
<input type="button" name="btnDown" value="-" onClick="addTime(document.f1.skip.value * (-1))">&nbsp;
<select name="skip" onChange="document.f1.skip.blur()">
EOF
print encode('utf-8', $output);

foreach my $so (@skip_options) {
  my $selected = "";
  if (@{$so}[0] eq "3") { $selected = " selected"; }
  print "<option value=\"" . @{$so}[0] * 1000 . "\"". $selected .">" . encode('utf-8', @{$so}[1]) . "</option>\n";
}

$output = <<EOF;
</select>
<input type="button" name="btnUp" value="+" onClick="addTime(document.f1.skip.value)">
<p id="controlButtonArea">
＜&nbsp;
<input type="button" name="btnDown4" value="60" onClick="addTime(-60000)">
<input type="button" name="btnDown3" value="15" onClick="addTime(-15000)">
<input type="button" name="btnDown2" value="1" onClick="addTime(-1000)">
<input type="button" name="btnDown1" value=".5" onClick="addTime(-500)">
&nbsp;|&nbsp;
<input type="button" name="btnUp1" value=".5" onClick="addTime(500)">
<input type="button" name="btnUp2" value="1" onClick="addTime(1000)">
<input type="button" name="btnUp3" value="15" onClick="addTime(15000)">
<input type="button" name="btnUp4" value="60" onClick="addTime(60000)">
&nbsp;＞
</p>
EOF
print encode('utf-8', $output);

$output = <<EOF;
<div id="messageArea"></div>
<input type="button" onClick="apply()" class="submit_button" name="btnApply" value="適用">&nbsp;
<input type="button" onClick="closeWindow()" name="btnClose" value="キャンセル"><br><br>
</div>
</form>

<script type="text/javascript">
<!--
  function getImageURL(elem) {
    var ss = elem.value;
    var imgurl = "${MOVIEIMG_CGI}?file=${encoded_path}&dir=${encoded_dir}&v_map=" + ${vno} + "&size=640&set_position=1&ss=" + ss;

    return imgurl;
  }

  function setTime() {
    if (!window.opener || window.opener.closed) {
      window.alert("メインウィンドウが閉じられています");
      return;
    }

    var ss = document.getElementsByName('selectedTimeStart')[0].value;
    var te = document.getElementsByName('selectedTimeEnd')[0].value;
    window.opener.document.enc_setting.${start_f}.value = ss;
    window.opener.document.enc_setting.${end_f}.value = te;
    var duration = getEncTimeDuration(ss, te);
    if (duration > 0) {
      window.opener.document.enc_setting.${duration_f}.value = getFormatTimeFromSecond(duration);
    } else {
      window.opener.document.enc_setting.${end_f}.value = ss;
      window.opener.document.enc_setting.${duration_f}.value = getFormatTimeFromSecond(0);
    }
  }

  // durationが取得出来た時にシーンのデータを取得する
  function callGetSceneData() {
    getSceneData("${GETFILE_CGI}", "${encoded_dir}", "${encoded_scene_path}");
  }

  window.onload = function() {
    if ("${clicked}" === "start") {
        document.f1.controlTimeSwitch[0].checked = true;
    } else {
        document.f1.controlTimeSwitch[1].checked = true;
    }
    setLoading(document.f1.previewStart, document.getElementById("reloadingStart"), document.f1.selectedTimeStart);
    setLoading(document.f1.previewEnd, document.getElementById("reloadingEnd"), document.f1.selectedTimeEnd);
    getMovieDuration("${MOVIE_INFO_CGI}", "${encoded_dir}", "${encoded_path}", "${vno}");
    document.f1.btnApply.focus();
  }
-->
</script>
EOF
print encode('utf-8', $output);

HTML_Elem->tail();
exit(0);

