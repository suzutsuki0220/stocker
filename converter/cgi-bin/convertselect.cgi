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
require '%conf_dir%/converter.conf';

my $q = eval{new CGI};

my $encoded_dir = HTML_Elem->url_encode(scalar($q->param('dir')));

my @files = ();
my $path;
my $base;
my $base_name = scalar($q->param('dir'));
my $encoded_path = scalar($q->param('file'));
eval {
  my $ins = ParamPath->new(base_dir_conf => $BASE_DIR_CONF);
  $ins->init_by_base_name(HTML_Elem->url_decode($base_name));
  $path = decode('utf-8', $ins->urlpath_decode($encoded_path));
  $base = $ins->{base};
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
my $html = HTML_Elem->new();
$html->{'javascript'} = \@jslist;
$html->header('timer selector');

my $pos        = $q->param('pos');
my $target     = $q->param('target');
my $start_f    = $q->param('start_f');
my $end_f      = $q->param('end_f');
my $duration_f = $q->param('duration_f');

if (!$target || !$start_f || !$end_f || !$duration_f) {
    HTML_Elem->error("parameter is not enough");
}

my $GRAY_PAD = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAAAwCAIAAAAuKetIAAAAQklEQVRo3u3PAQkAAAgDMLV/mie0hSBsDdZJ6rOp5wQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBATuLGnyAnZizub2AAAAAElFTkSuQmCC";

print <<EOF;
<form action="$ENV{'SCRIPT_NAME'}" method="GET" name="f1" autocomplete="off">
<div style="position: relative; width: 640px;">
  <img src="${GRAY_PAD}" id="preview" name="preview">
  <div style="position: absolute; top: 50%; left: 50%; display: none; background-color: white; color: #121212" id="PreviewReloading">
    Reloading...
  </div>
</div>
<div style="text-align: center">
<input type="range" name="seekFrom" style="width: 100%" min="0" max="1000" step="1" value="0" onChange="changeTime(document.f1.selectedTime, this)">
<br>
＜&nbsp;
<input type="button" name="btnDown4" value="60" onClick="addTime(-60000)">
<input type="button" name="btnDown3" value="15" onClick="addTime(-15000)">
<input type="button" name="btnDown2" value="1" onClick="addTime(-1000)">
<input type="button" name="btnDown1" value=".5" onClick="addTime(-500)">&nbsp;&nbsp;
<input type="button" name="btnDown" value="-" onClick="addTime(document.f1.skip.value * (-1))">&nbsp;
<select name="skip" onChange="document.f1.skip.blur()">
EOF

foreach my $so (@skip_options) {
  my $selected = "";
  if (@{$so}[0] eq "3") { $selected = " selected"; }
  print "<option value=\"" . @{$so}[0] * 1000 . "\"". $selected .">" . @{$so}[1] . "</option>\n";
}

print <<EOF;
</select>&nbsp;
<input type="button" name="btnUp" value="+" onClick="addTime(document.f1.skip.value)">&nbsp;&nbsp;
<input type="button" name="btnUp1" value=".5" onClick="addTime(500)">
<input type="button" name="btnUp2" value="1" onClick="addTime(1000)">
<input type="button" name="btnUp3" value="15" onClick="addTime(15000)">
<input type="button" name="btnUp4" value="60" onClick="addTime(60000)">
&nbsp;＞
<br>
Time: <input type="text" name="selectedTime" size="30" value="${pos}"><br>
<br>
<input type="button" onClick="apply()" name="btnApply" value="適用">&nbsp;
<input type="button" onClick="closeWindow()" name="btnClose" value="キャンセル">
</div>
</form>

<script type="text/javascript">
<!--
  function getImageURL() {
    var vmap = window.opener.document.enc_setting.v_map.value;
    var ss   = document.f1.selectedTime.value;
    var imgurl = "${MOVIEIMG_CGI}?file=${encoded_path}&dir=${encoded_dir}&v_map=" + vmap + "&size=640&set_position=1&ss=" + ss;

    return imgurl;
  }

  function setTime() {
    if (!window.opener || window.opener.closed) {
      window.alert("メインウィンドウが閉じられています");
      return;
    }

    var selected_time = document.f1.selectedTime.value;
    if (selected_time) {
      window.opener.document.enc_setting.${target}.value = selected_time;

      var ss = window.opener.document.enc_setting.${start_f}.value;
      var te = window.opener.document.enc_setting.${end_f}.value;
      var duration = getEncTimeDuration(ss, te);
      if (duration > 0) {
        window.opener.document.enc_setting.${duration_f}.value = getFormatTimeFromSecond(duration);
      } else {
        window.opener.document.enc_setting.${end_f}.value = ss;
        window.opener.document.enc_setting.${duration_f}.value = getFormatTimeFromSecond(0);
      }
    } else {
      alert("Timeが選択されていません");
    }
  }

  reloadImage();
  getMovieDuration("${MOVIE_INFO_CGI}", "${encoded_dir}", "${encoded_path}");
-->
</script>
EOF

HTML_Elem->tail();
exit(0);

