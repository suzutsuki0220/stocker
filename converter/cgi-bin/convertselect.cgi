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
my $mode = $q->param('mode');
my $in   = $q->param('in');
my $dir  = $q->param('dir');
my $out_dir = $q->param('out_dir');

if(! ${in} || length(${in}) <= 0 ) {
  HTML_Elem->header();
  HTML_Elem->error("パスが指定されていません。");
}

my @files = ();
my $path;
my $base;
eval {
  my $ins = ParamPath->new(base_dir_conf => $BASE_DIR_CONF,
                           param_dir => $q->param('dir'));
  $ins->init();
  $path = $ins->inode_to_path($q->param('in'));
  $base = $ins->{base};
};
if ($@) {
  HTML_Elem->header();
  HTML_Elem->error($@);
}

my @skip_options = (
  ["0.001", "1/100 秒"],
  ["0.031", "1/32 秒"],
  ["0.063", "1/16 秒"],
  ["0.125", "1/8 秒"],
  ["0.25", "1/4 秒"],
  ["0.5", "1/2 秒"],
  ["1", "1 秒"],
  ["3", "3 秒"],
  ["5", "5 秒"],
  ["15", "15 秒"],
  ["30", "30 秒"],
  ["60", "1 分"],
  ["180", "3 分"],
  ["900", "15 分"],
  ["1800", "30 分"],
  ["3600", "60 分"],
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

  my $ss = $q->param('ss');
  my $target = $q->param('target') eq 'tend' ? "tend" : "ss";
  my $duration = get_video_duration($encfile);

  &print_script($target);

  print <<EOF;
<form action="$ENV{'SCRIPT_NAME'}" method="GET" name="f1">
<div style="position: relative; width: 640px;">
  <img src="${MOVIEIMG_CGI}?in=${in}&dir=${dir}&size=640&set_position=1&ss=${ss}" id="preview">
  <div style="position: absolute; top: 50%; left: 50%; display: none;" id="ReloadImgButton">
    <input type="button" name="btnReloadImg" value="更新" onClick="reloadImage()">
  </div>
</div>
<div style="text-align: center">
<input type="button" name="btnDown" value="-" onClick="upTime(document.f1.skip.value * (-1))">&nbsp;
<select name="skip">
EOF

  foreach my $so (@skip_options) {
    print "<option value=\"" . @{$so}[0] * 1000 . "\">" . @{$so}[1] . "</option>\n";
  }

print <<EOF;
</select>&nbsp;
<input type="button" name="btnUp" value="+" onClick="upTime(document.f1.skip.value)">
<br>
Time: <input type="text" name="selectedTime" size="30" value="${ss}"><br>
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
<form action="$ENV{'SCRIPT_NAME'}" method="GET" name="f1">
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
    print "<img src=\"${MOVIEIMG_CGI}?in=${in}&dir=${dir}&size=120&set_position=1&ss=${timestr}\">";
    print "</a><br>$timestr</div>\n";
    $pos += $skip;
  }

  print "<input type=\"hidden\" name=\"mode\" value=\"${mode}\">\n";
  print "<input type=\"hidden\" name=\"in\" value=\"${in}\">\n";
  print "<input type=\"hidden\" name=\"dir\" value=\"${dir}\">\n";
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
  my ($target) = @_;

  print <<EOF;
<script type="text/javascript">
<!--
  function setTime() {
    if (!window.opener || window.opener.closed) {
      window.alert("メインウィンドウが閉じられています");
      return;
    }

    var selected_time = document.f1.selectedTime.value;
    if (selected_time) {
      window.opener.document.enc_setting.${target}.value = selected_time;

      var ss = window.opener.document.enc_setting.ss.value;
      var te = window.opener.document.enc_setting.tend.value;
      window.opener.document.enc_setting.t.value = calculateT(ss, te);
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

  function reloadImage() {
    var ss = document.f1.selectedTime.value;
    var imgurl = "${MOVIEIMG_CGI}?in=${in}&dir=${dir}&size=640&set_position=1&ss=" + ss;

    document.getElementById("preview").src = imgurl;
    document.getElementById("ReloadImgButton").style.display = "none";
  }

  function upTime(num) {
    var t = parseTimeStr(document.f1.selectedTime.value);

    if (t) {
      document.getElementById("ReloadImgButton").style.display = "block";

      var hour = t[0];
      var min  = t[1];
      var sec  = t[2];
      var mili = t[3];

      var tm = parseInt(hour * 3600000 + min * 60000 + sec * 1000 + mili);
      tm += parseInt(num);

      hour = Math.floor(tm / 3600000);
      min  = Math.floor((tm - hour * 3600000) / 60000);
      sec  = Math.floor(((tm - hour * 3600000) - (min * 60000)) / 1000);
      mili = tm - hour * 3600000 - min * 60000 - sec * 1000;

      document.f1.selectedTime.value = formatTime(hour, min, sec, mili);
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
