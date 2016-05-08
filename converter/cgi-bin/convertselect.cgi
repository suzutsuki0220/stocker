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

my $encfile = $base . $path;

&print_timesel();

exit 0;

#####

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

  function closeWindow() {
    window.close();
  }
-->
</script>
<form action="$ENV{'SCRIPT_NAME'}" method="GET" name="f1">
間隔: <select name="skip" onChange="document.f1.submit()">
<option value="0.03125">1/32 秒</option>
<option value="0.0625">1/16 秒</option>
<option value="0.125">1/8 秒</option>
<option value="0.25">1/4 秒</option>
<option value="0.5">1/2 秒</option>
<option value="1">1 秒</option>
<option value="3">3 秒</option>
<option value="5">5 秒</option>
<option value="15">15 秒</option>
<option value="30">30 秒</option>
<option value="60">1 分</option>
<option value="180">3 分</option>
<option value="900">15 分</option>
<option value="1800">30 分</option>
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
