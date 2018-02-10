#!/usr/bin/perl

use strict;
use warnings;
use utf8;
use Encode;
use CGI;
use XML::Simple;

use lib '%libs_dir%';
use ParamPath;
use HTML_Elem;

our $MOVIEIMG_CGI   = "";
our $BASE_DIR_CONF  = "";
our $MOVIE_INFO_CMD = "";
require '%conf_dir%/converter.conf';

my $q = eval{new CGI};
my $mode = scalar($q->param('mode'));
my $out_dir = scalar($q->param('out_dir'));

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

my $encfile = $base . $path;

&frame_selector();
#&print_timesel();

exit 0;

#####

sub frame_selector
{
  my @jslist = ("%htdocs_root%/converter_form.js");
  my $html = HTML_Elem->new();
  $html->{'javascript'} = \@jslist;
  $html->header('timer selector');

  my $pos        = $q->param('pos');
  my $target     = $q->param('target');
  my $start_f    = $q->param('start_f');
  my $end_f      = $q->param('end_f');
  my $duration_f = $q->param('duration_f');
  my $duration   = get_video_duration($encfile);

  if (!$target || !$start_f || !$end_f || !$duration_f) {
    HTML_Elem->error("parameter is not enough");
  }

  &print_script($target, $start_f, $end_f, $duration_f);

  print <<EOF;
<form action="$ENV{'SCRIPT_NAME'}" method="GET" name="f1" autocomplete="off">
<div style="position: relative; width: 640px;">
  <img src="${MOVIEIMG_CGI}?file=${encoded_path}&dir=${encoded_dir}&size=640&set_position=1&ss=${pos}" id="preview" name="preview">
  <div style="position: absolute; top: 50%; left: 50%; display: none; background-color: white; color: #121212" id="PreviewReloading">
    Reloading...
  </div>
</div>
<div style="text-align: center">
<input type="range" name="seekbar" style="width: 100%" min="0" max="1000" step="1" value="0">
<br>
＜&nbsp;
<input type="button" name="btnDown4" value="60" onClick="upTime(-60000)">
<input type="button" name="btnDown3" value="15" onClick="upTime(-15000)">
<input type="button" name="btnDown2" value="1" onClick="upTime(-1000)">
<input type="button" name="btnDown1" value=".5" onClick="upTime(-500)">&nbsp;&nbsp;
<input type="button" name="btnDown" value="-" onClick="upTime(document.f1.skip.value * (-1))">&nbsp;
<select name="skip" onChange="document.f1.skip.blur()">
EOF

  foreach my $so (@skip_options) {
    my $selected = "";
    if (@{$so}[0] eq "3") { $selected = " selected"; }
    print "<option value=\"" . @{$so}[0] * 1000 . "\"". $selected .">" . @{$so}[1] . "</option>\n";
  }

print <<EOF;
</select>&nbsp;
<input type="button" name="btnUp" value="+" onClick="upTime(document.f1.skip.value)">&nbsp;&nbsp;
<input type="button" name="btnUp1" value=".5" onClick="upTime(500)">
<input type="button" name="btnUp2" value="1" onClick="upTime(1000)">
<input type="button" name="btnUp3" value="15" onClick="upTime(15000)">
<input type="button" name="btnUp4" value="60" onClick="upTime(60000)">
&nbsp;＞
<br>
Time: <input type="text" name="selectedTime" size="30" value="${pos}"><br>
<br>
<input type="button" onClick="apply()" name="btnApply" value="適用">&nbsp;
<input type="button" onClick="closeWindow()" name="btnClose" value="キャンセル">
</div>
</form>
EOF

  HTML_Elem->tail();
  exit(0);
}

sub print_timesel
{
  my @jslist = ("%htdocs_root%/converter_form.js");
  my $html = HTML_Elem->new();
  $html->{'javascript'} = \@jslist;
  $html->header('timer selector');

  my $target = $q->param('target') eq 'tend' ? "tend" : "ss";
  my $duration = get_video_duration($encfile);
  my $icons = $q->param('icons') ? $q->param('icons') : 25;
  my $time  = $q->param('time') ? $q->param('time') : 0;
  my $skip  = $q->param('skip') ? $q->param('skip') : $duration / $icons;
  my $selectedTime = $q->param('selectedTime');
  my $pos = $time - ($skip * (($icons-1)/2));
  if ($pos < 0) { $pos = 0 };

  &print_script($target);

  print <<EOF;
<form action="$ENV{'SCRIPT_NAME'}" method="GET" name="f1" autocomplete="off">
間隔: <select name="skip" onChange="document.f1.submit()">
EOF

  foreach my $so (@skip_options) {
    print "<option value=\"" . @{$so}[0] . "\">" . @{$so}[1] . "</option>\n";
  }

  print <<EOF;
<option value="" selected>全体表示</option>
</select><br>
<script type="text/javascript">
<!--
  var i=0;
  for (i=0; i<document.f1.skip.options.length; i++) {
    if (document.f1.skip.options[i].value == "${skip}") {
      document.f1.skip.options[i].selected = true;
    }
  }
-->
</script>
EOF

  my $i;
  for ($i=0; $i<$icons; $i++) {
    if ($pos > $duration) {
      last;
    }
    my $sec = int($pos);  # 全体秒
    my $xx  = ($pos - $sec) * 1000;
    my $ss  = $sec % 60;
    my $mm  = ($sec - $ss) / 60 % 60;
    my $hh  = ($sec - $mm - $ss) / 3600;
    my $timestr = sprintf("%02d:%02d:%02d.%03d", $hh, $mm, $ss, $xx);
    print "<div style=\"background-color: #cccccc; margin-top: 5px; padding-left: 1px; padding-right: 1px; float: left; text-align: center; font-size: 9pt;\">";
    print "<a href=\"javascript: select_time(\'${timestr}\')\">";
    print "<img src=\"${MOVIEIMG_CGI}?file=${encoded_path}&dir=${encoded_dir}&size=120&set_position=1&ss=${timestr}\">";
    print "</a><br>$timestr</div>\n";
    $pos += $skip;
  }

  print "<input type=\"hidden\" name=\"mode\" value=\"${mode}\">\n";
  print "<input type=\"hidden\" name=\"file\" value=\"${encoded_path}\">\n";
  print "<input type=\"hidden\" name=\"dir\" value=\"${encoded_dir}\">\n";
  print "<input type=\"hidden\" name=\"target\" value=\"${target}\">\n";
  print "<input type=\"hidden\" name=\"icons\" value=\"${icons}\">\n";
  print "<input type=\"hidden\" name=\"time\" value=\"${time}\">\n";
  print <<EOF;
<p style="clear: both; padding-top: 5px; padding-bottom: 5px;">&nbsp;</p>
<p style="text-align: center">
Time: <input type="text" name="selectedTime" size="30" value="${selectedTime}">
<input type="button" onClick="setTime()" name="btnSet" value="設定"><br>
<input type="button" onClick="closeWindow()" name="btnClose" value="閉じる">
</p>
</form>
EOF

  HTML_Elem->tail();
  exit(0);
}

sub get_video_duration
{
  my ($filename) = @_;

  my $cmd_movie_info = "${MOVIE_INFO_CMD} %%INPUT%%";
  $cmd_movie_info =~ s/%%INPUT%%/"${encfile}"/;

  ## get movie information by FFMpeg API
  open (IN, "${cmd_movie_info} |");
  my $movie_info_xml = "";
  while(my $line = <IN>) {
    $movie_info_xml .= $line;
  }
  close (IN);

  my $xml = XML::Simple->new(KeepRoot=>1, ForceArray=>1);
  my $movie_info = $xml->XMLin($movie_info_xml);
  my $hhmmssxxx  = $movie_info->{'movie_info'}[0]->{'duration'}[0];
  $hhmmssxxx =~ /([0-9][0-9]):([0-9][0-9]):([0-9][0-9]).[0-9]{1,}/;
  my $hh = $1;
  my $mm = $2;
  my $ss = $3;
  my $duration = 3600*$hh + 60*$mm + $ss;

  return $duration;
}

sub print_script
{
  my ($target, $start_f, $end_f, $duration_f) = @_;

  print <<EOF;
<script type="text/javascript">
<!--
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
        window.opener.document.enc_setting.${duration_f}.value = getEncTimeString(duration);
      } else {
        window.opener.document.enc_setting.${end_f}.value = ss;
        window.opener.document.enc_setting.${duration_f}.value = getEncTimeString(0);
      }
    } else {
      alert("Timeが選択されていません");
    }
  }

  function select_time(t) {
    document.f1.selectedTime.value = t;
    tim = t.split(":");
    document.f1.time.value = parseFloat(tim[0]*3600) + parseFloat(tim[1]*60) + parseFloat(tim[2]);
    document.f1.submit();
  }

  function apply() {
    setTime();
    window.close();
  }

  function closeWindow() {
    window.close();
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

  function reloadImage() {
    if (loading) {
      load_again = true;
      return;
    }

    if (document.preview.addEventListener) {
      document.preview.addEventListener("load", unsetLoading, false);
      document.preview.addEventListener("error", unsetLoading, false);
      document.preview.addEventListener("abort", unsetLoading, false);
    } else if (document.preview.attachEvent) {
      document.preview.attachEvent("onload", unsetLoading);
      document.preview.attachEvent("onerror", unsetLoading);
      document.preview.attachEvent("onabort", unsetLoading);
    }

    var ss = document.f1.selectedTime.value;
    var imgurl = "${MOVIEIMG_CGI}?file=${encoded_path}&dir=${encoded_dir}&size=640&set_position=1&ss=" + ss;

    loading = true;
    document.getElementById("preview").src = imgurl;
    document.getElementById("PreviewReloading").style.display = "block";
  }

  function unsetLoading() {
    if (document.preview.removeEventListener) {
      document.preview.removeEventListener("load", unsetLoading, false);
      document.preview.removeEventListener("error", unsetLoading, false);
      document.preview.removeEventListener("abort", unsetLoading, false);
    } else if (document.preview.detachEvent) {
      document.preview.detachEvent("onload", unsetLoading);
      document.preview.detachEvent("onerror", unsetLoading);
      document.preview.detachEvent("onabort", unsetLoading);
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
        upTime(document.f1.skip.value * (-1));
        break;
      case 39: // right
      case 72:
        upTime(document.f1.skip.value);
        break;
      case 38: // up     
        selectSkipDown(-1);
        break;
      case 40: // down
        selectSkipDown(1);
        break;
      case 70: // f
        upTime(-500);
        break;
      case 68: // d
        upTime(-1000);
        break;
      case 83: // s
        upTime(-15000);
        break;
      case 65: // a
        upTime(-60000);
        break;
      case 74: // j
        upTime(500);
        break;
      case 75: // k
        upTime(1000);
        break;
      case 76: // l
        upTime(15000);
        break;
      case 187: // ;
        upTime(60000);
        break;
    }
  }

  function upTime(num) {
    var t = parseTimeStr(document.f1.selectedTime.value);

    if (t) {
      var hour = t[0];
      var min  = t[1];
      var sec  = t[2];
      var mili = t[3];

      var tm = parseInt(hour * 3600000 + min * 60000 + sec * 1000 + mili);
      tm += parseInt(num);

      if (tm < 0) {
        tm = 0;
      }

      hour = Math.floor(tm / 3600000);
      min  = Math.floor((tm - hour * 3600000) / 60000);
      sec  = Math.floor(((tm - hour * 3600000) - (min * 60000)) / 1000);
      mili = tm - hour * 3600000 - min * 60000 - sec * 1000;

      document.f1.selectedTime.value = formatTime(hour, min, sec, mili);

      reloadImage();
    }
  }

  function parseTimeStr(time_str) {
    var col = new Array();

    hhmmss = time_str.split(":");
    if (hhmmss.length != 3) {
      window.alert("書式が不正です");
      return;
    }

    sss = hhmmss[2].split(".");
    if (sss.length != 2) {
      window.alert("書式が不正です");
      return;
    }

    col.push(parseInt(hhmmss[0]));
    col.push(parseInt(hhmmss[1]));
    col.push(parseInt(sss[0]));
    col.push(parseInt(sss[1]));

    return col;
  }

  function formatTime(hour, min, sec, mili) {
    hour = ("0" + hour).substr(-2);
    min  = ("0" + min).substr(-2);
    sec  = ("0" + sec).substr(-2);
    mili = ("00" + mili).substr(-3);

    return hour + ":" + min + ":" + sec + "." + mili;
  }
-->
</script>
EOF
}
