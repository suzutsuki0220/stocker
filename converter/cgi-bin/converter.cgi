#!/usr/bin/perl

use strict;
use warnings;
use utf8;
use Encode;
use CGI;
use File::Path;

use lib '%libs_dir%';
use ParamPath;
use HTML_Elem;
use ConverterJob;

our $STOCKER_CGI    = "";
our $SELECTOR_CGI   = "";
our $MOVIEIMG_CGI   = "";
our $GETFILE_CGI    = "";
our $MOVIE_INFO_CGI = "";
our $BASE_DIR_CONF  = "";
our $SUPPORT_TYPES  = "";
our $TMP_FILE       = "";
our $CONV_OUT_DIR   = "";
our $ENCBATCH_LIST  = "";
require '%conf_dir%/converter.conf';

our @support_video_types;
our @support_audio_types;
require $SUPPORT_TYPES;

my @encode_video_types = (
  ["H.264", "H.264 (mp4)"],
  ["mts", "MPEG-TS"],
  ["dvd", "DVD-VIDEO (MPEG2)"],
  ["mpeg4", "MPEG4"],
  ["webm", "WebM"],
  ["ogv", "ogv"],
  ["wmv", "Windows Media(WMVv8)"],
  ["asf", "asf(WMVv7)"],
  ["I-Frame", "Iフレーム(画像)"],
  ["HighLight", "HighLight(画像)"]
);

my @encode_audio_types = (
  ["wav", "Wave (Audio)"],
  ["flac", "flac (Audio)"],
  ["mp3", "mp3 (Audio)"],
  ["aac", "aac (Audio)"],
);

my $q = eval{new CGI};
my $mode = scalar($q->param('mode'));
my $dir  = HTML_Elem->url_decode(scalar($q->param('dir')));
my $out_dir = scalar($q->param('out_dir'));
my @files = $q->param('file');

my $path;
my $base;
eval {
  my $ins = ParamPath->new(base_dir_conf => $BASE_DIR_CONF);
  $ins->init_by_base_name($dir);
  $path =decode('utf-8', $ins->urlpath_decode($files[0]));
  $base = $ins->{base};
};
if ($@) {
  HTML_Elem->header();
  HTML_Elem->error($@);
}

$dir = HTML_Elem->url_encode($dir);
my $encoded_path = $files[0];

my $up_path = ParamPath->get_up_path($path);
my $encoded_up_path = ParamPath->urlpath_encode(encode('utf-8', $up_path));

if (@files.length == 0) {
  HTML_Elem->header();
  HTML_Elem->error("ファイルが選択されていません");
}

for (my $i=0; $i<@files.length; $i++) {
  $files[$i] = decode('utf-8', ParamPath->urlpath_decode($files[$i]));
}
@files = sort {$a cmp $b} @files;

my $encfile = $base . decode('utf-8', ParamPath->urlpath_decode($encoded_path));

my $mtype = &check_capable_type($encfile);
if ($mtype eq "unsupported") {
  HTML_Elem->header();
  HTML_Elem->error("対応していない形式です: " . encode('utf-8', $encfile));
}

# エンコード出力先
my $out_path = encode('utf-8', $CONV_OUT_DIR ."/". ${out_dir});

if(${mode} eq "encode") {
  &perform_encode();
} else {
  &print_form();
}

exit(0);

#############################

### エンコード
sub perform_encode() {
  HTML_Elem->header();
  print "<h2>エンコードキューに入れました</h2>";

  if (-d $out_path) {
    print "<p><font color=\"red\">警告: 出力先が既に存在します。同名のファイルは上書きされます</font></p>";
  }

  if ($q->param('multi_editmode') eq "sameenc") {
    foreach (@files) {
      &add_encodejob("${base}" . $_);
    }
  } elsif ($q->param('multi_editmode') eq "combine") {
    my $concat = "concat:";
    foreach (@files) {
      $concat .= "${base}" . $_ . "|";
    }
    &add_encodejob("$concat");
  } else {
    &add_encodejob("${base}${path}");
  }

  print "<a href=\"${STOCKER_CGI}?file=${encoded_up_path}&dir=${dir}\">← フォルダーに戻る</a>";

  HTML_Elem->tail();
}

sub add_encodejob()
{
  my ($source) = @_;

  my $job = ConverterJob->new(listfile => $ENCBATCH_LIST);
  $job->{source} = $source;
  $job->{out_dir} = decode('utf-8', $q->param('out_dir'));
  $job->{format} = $q->param('format');
  if ($q->param('set_position')) {
    $job->{set_position} = 'true';
    my @ss_list = ();
    my @t_list = ();
    my $i = 0;
    while ($q->param('ss'.$i)) {
      push(@ss_list, $q->param('ss'.$i));
      push(@t_list, $q->param('t'.$i) ? $q->param('t'.$i) : 0);
      $i++;
    }
    $job->{ss} = \@ss_list;
    $job->{t}  = \@t_list;
  } else {
    $job->{set_position} = 'false';
  }
  $job->{pass2} = $q->param('pass2') ? 'true' : 'false';
  $job->{v_v_map} = $q->param('v_map');
  $job->{v_v_copy} = $q->param('v_copy') ? 'true' : 'false';
  $job->{v_enable_crop} = $q->param('enable_crop') ? 'true' : 'false';
  $job->{v_crop_w} = $q->param('crop_w');
  $job->{v_crop_h} = $q->param('crop_h');
  $job->{v_crop_x} = $q->param('crop_x');
  $job->{v_crop_y} = $q->param('crop_y');
  $job->{v_enable_pad} = $q->param('enable_pad') ? 'true' : 'false';
  $job->{v_pad_w} = $q->param('pad_w');
  $job->{v_pad_h} = $q->param('pad_h');
  $job->{v_pad_x} = $q->param('pad_x');
  $job->{v_pad_y} = $q->param('pad_y');
  $job->{v_pad_color} = $q->param('pad_color');
  $job->{v_s_w} = $q->param('s_w');
  $job->{v_s_h} = $q->param('s_h');
  $job->{v_aspect_set} = $q->param('aspect_set');
  $job->{v_aspect_numerator} = $q->param('aspect_numerator');
  $job->{v_aspect_denominator} = $q->param('aspect_denominator');
  $job->{v_r} = $q->param('r');
  $job->{v_b} = $q->param('b');
  $job->{v_enable_adjust} = $q->param('enable_adjust') ? 'true' : 'false';
  $job->{v_brightness} = $q->param('brightness');
  $job->{v_contrast} = $q->param('contrast');
  $job->{v_gamma} = $q->param('gamma');
  $job->{v_hue} = $q->param('hue');
  $job->{v_saturation} = $q->param('saturation');
  $job->{v_sharp} = $q->param('sharp');
  $job->{v_rg} = $q->param('rg');
  $job->{v_gg} = $q->param('gg');
  $job->{v_bg} = $q->param('bg');
  $job->{v_weight} = $q->param('weight');
  $job->{v_deinterlace} = $q->param('deinterlace') ? 'true' : 'false';
  $job->{v_deshake} = $q->param('deshake')? 'true' : 'false';
  $job->{a_a_map} = $q->param('a_map');
  $job->{a_a_copy} = $q->param('a_copy') ? 'true' : 'false';
  $job->{a_ar} = $q->param('ar');
  $job->{a_ab} = $q->param('ab');
  $job->{a_ac} = $q->param('ac');
  $job->{a_cutoff} = $q->param('cutoff');
  $job->{a_volume} = $q->param('volume');

  $job->add();
}


### 動画情報表示
sub print_form() {
  my $GRAY_PAD = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAAAwCAIAAAAuKetIAAAAQklEQVRo3u3PAQkAAAgDMLV/mie0hSBsDdZJ6rOp5wQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBATuLGnyAnZizub2AAAAAElFTkSuQmCC";

  my $mp4_url = "${GETFILE_CGI}?file=${encoded_path}&dir=${dir}&mime=video/mp4";
  my $thm_url = "${MOVIEIMG_CGI}?file=${encoded_path}&dir=${dir}&size=640";
  my $mes;

  my @jslist = (
      "%htdocs_root%/main.js",
      "%htdocs_root%/converter_common.js",
      "%htdocs_root%/converter_form.js",
  );
  my @csslist = (
      "%htdocs_root%/stocker.css",
      "%htdocs_root%/converter_form.css",
  );
  my $html = HTML_Elem->new();
  $html->{'javascript'} = \@jslist;
  $html->{'css'} = \@csslist;
  $html->header();

  $mes = <<EOF;
<a href="${STOCKER_CGI}?file=${encoded_up_path}&dir=${dir}">← 戻る</a><br>
<h1>ファイル変換</h1>
EOF
  print encode('utf8', $mes);

  if ($mtype eq "video") {
    if (lc($path) =~ /\.mp4$/ || lc($path) =~ /\.m4v$/ || lc($path) =~ /\.mpg4$/) {
      print "<video src=\"$mp4_url\" id=\"vimg\" type=\"video/mp4\" poster=\"$thm_url\" width=\"640\" controls></video>\n";
    } else {
      print "<img src=\"$thm_url\" id=\"vimg\" width=\"640\">\n";
    }
  }
  print "<h2>変換元ファイル</h2>\n";

  foreach (@files) {
    print encode('utf-8', $_) . "<br>\n";
  }

  $mes = <<EOF;
<h2>情報</h2>
<form action="$ENV{'SCRIPT_NAME'}" name="enc_setting" method="POST" autocomplete="off">
<div id="information_table"></div>

<script type="text/javascript">
<!--
  getMovieInfo('${MOVIE_INFO_CGI}', '${dir}', '${encoded_path}');
-->
</script>
EOF
  print encode('utf-8', $mes);

  my $vid_width  = 0;
  my $vid_height = 0;
  my $vid_fps    = 0;
  my $x_ratio = 1;
  my $y_ratio = 1;
  my $default_bps  = 0;
  my $round_fps    = 0;

  print "<h2>変換の設定</h2>\n";
  if (@files.length() > 1) {
    print "<p><b>複数のファイルが指定されています</b><br>\n";
    print "変換方法: ";
    print "<input type=\"radio\" name=\"multi_editmode\" value=\"combine\" checked> 複数の動画を結合してエンコード";
    print "&nbsp;&nbsp;";
    print "<input type=\"radio\" name=\"multi_editmode\" value=\"sameenc\"> 同じ設定でエンコード";
    print "<br></p>\n";
  }
  foreach (@files) {
    my $e = ParamPath->urlpath_encode(encode('utf-8', $_));
    print "<input type=\"hidden\" name=\"file\" value=\"${e}\">\n";
  }

  $mes = <<EOD;
ソースの場所: <span id="source_location"></span>
<script type="text/javascript">
<!--
  writeSourceLocation("${path}");
EOD
  print encode('utf-8', $mes);

  print <<EOD;
  function getPreviewUrl(width) {
    var url = "${MOVIEIMG_CGI}?dir=${dir}&file=${encoded_path}&size=" + width;
    if (document.enc_setting.v_map.length !== 0) {
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
    if(document.enc_setting.enable_adjust.checked == true) {
      adjust_preview();
    } else {
      document.adjpreview.src = "${GRAY_PAD}";
    }
  }

  function fixHeight() {
    if( document.enc_setting.s_w.length <= 0 || document.enc_setting.s_w.value <= 10 ) {
      alert('解像度が小さすぎます');
      return;
    }
    if( document.enc_setting.s_w.value % 8 != 0 ) {
      alert('解像度は8の倍数にして下さい。');
      return;
    }
    print_aspect('ssize');
    if( document.enc_setting.save_aspect.checked == true ) {
      document.enc_setting.s_h.value = Math.round(document.enc_setting.s_w.value / ${x_ratio} * ${y_ratio});
    }
  }

  function fixWidth() {
    if( document.enc_setting.s_h.length <= 0 || document.enc_setting.s_h.value <= 10 ) {
      alert('解像度が小さすぎます');
      return;
    }
    if( document.enc_setting.s_h.value % 8 != 0 ) {
      alert('解像度は8の倍数にして下さい。');
      return;
    }
    print_aspect('ssize');
    if( document.enc_setting.save_aspect.checked == true ) {
      document.enc_setting.s_w.value = Math.round(document.enc_setting.s_h.value / ${y_ratio} * ${x_ratio});
    }
  }

  function changeEncodeParameter() {
    var checked_format = "unknown";
    var i;
    for(i=0;i<document.enc_setting.format.options.length;i++){
      if( document.enc_setting.format.options[i].selected ) {
        checked_format = document.enc_setting.format.options[i].value;
        break;
      }
    }

/*
    if ( checked_format == 'copy' ) {
      document.enc_setting.save_aspect.disabled = true;
      document.enc_setting.s_w.disabled = true;
      document.enc_setting.s_h.disabled = true;
      document.enc_setting.r.disabled = true;
      document.enc_setting.b.disabled = true;
      document.enc_setting.deinterlace.disabled = true;
      document.enc_setting.ar.disabled= true;
      document.enc_setting.ac[0].disabled = true;
      document.enc_setting.ac[1].disabled = true;
      document.enc_setting.ab.disabled = true;
      document.enc_setting.cutoff.disabled = true;
      document.enc_setting.pass2.checked = false;
      document.enc_setting.pass2.disabled = true;
    } else {
      document.enc_setting.save_aspect.disabled = false;
      document.enc_setting.s_w.disabled = false;
      document.enc_setting.s_h.disabled = false;
      document.enc_setting.r.disabled = false;
      document.enc_setting.b.disabled = false;
      document.enc_setting.deinterlace.disabled = false;
      document.enc_setting.ar.disabled= false;
      document.enc_setting.ac[0].disabled = false;
      document.enc_setting.ac[1].disabled = false;
      document.enc_setting.ab.disabled = false;
      document.enc_setting.cutoff.disabled = false;
      document.enc_setting.pass2.disabled = false;
    }
*/

    if( checked_format == 'mts' ) {
      document.enc_setting.v_copy.checked = true;
      document.enc_setting.a_copy.checked = false;
      document.enc_setting.ar.options[0].selected = true;  // Original
      document.enc_setting.ab.options[1].selected = true;  // 256kbps
    } else if ( checked_format == 'dvd' ) {
      document.enc_setting.v_copy.checked = false;
      document.enc_setting.save_aspect.checked = false;
      document.enc_setting.s_w.value = 720;
      document.enc_setting.s_h.value = 480;
      document.enc_setting.r.value = 29.97;
      document.enc_setting.b.value = 5000;
      document.enc_setting.deinterlace.checked = false;
      document.enc_setting.a_copy.checked = false;
      document.enc_setting.ar.options[1].selected = true;  // 48k
      document.enc_setting.ab.options[2].selected = true;  // 192kbps
      document.enc_setting.cutoff.value = 18000;
    } else if ( checked_format == 'mpeg4' ) {
      document.enc_setting.v_copy.checked = false;
      document.enc_setting.save_aspect.checked = false;
      document.enc_setting.s_w.value = 640;
      document.enc_setting.s_h.value = 480;
      //document.enc_setting.r.value = ${round_fps};
      document.enc_setting.b.value = 1024;
      //document.enc_setting.deinterlace.checked = false;
      document.enc_setting.a_copy.checked = false;
      document.enc_setting.ar.options[0].selected = true;  // Original
      document.enc_setting.ab.options[5].selected = true;  // 96kbps
      document.enc_setting.cutoff.value = 12000;
    } else if ( checked_format == 'H.264' ) {
      document.enc_setting.v_copy.checked = false;
      document.enc_setting.save_aspect.checked = false;
      document.enc_setting.s_w.value = 640;
      document.enc_setting.s_h.value = 480;
      //document.enc_setting.r.value = ${round_fps};
      document.enc_setting.b.value = 1024;
      //document.enc_setting.deinterlace.checked = false;
      document.enc_setting.a_copy.checked = false;
      document.enc_setting.ar.options[0].selected = true;  // Original
      document.enc_setting.ab.options[3].selected = true;  // 160kbps
      document.enc_setting.cutoff.value = 0;
    } else if ( checked_format == 'wmv' ) {
      document.enc_setting.v_copy.checked = false;
      document.enc_setting.save_aspect.checked = true;
      //document.enc_setting.s_w.value = ${vid_width};
      //document.enc_setting.s_h.value = ${vid_height};
      //document.enc_setting.r.value = ${round_fps};
      //document.enc_setting.b.value = ${default_bps};
      //document.enc_setting.deinterlace.checked = false;
      document.enc_setting.a_copy.checked = false;
      document.enc_setting.ar.options[0].selected = true;  // Original
      document.enc_setting.ab.options[3].selected = true;  // 160kbps
      document.enc_setting.cutoff.value = 18000;
    } else if ( checked_format == 'asf' ) {
      document.enc_setting.v_copy.checked = false;
      document.enc_setting.save_aspect.checked = false;
      document.enc_setting.s_w.value = 320;
      document.enc_setting.s_h.value = 160;
      //document.enc_setting.r.value = ${round_fps};
      document.enc_setting.b.value = 512;
      //document.enc_setting.deinterlace.checked = false;
      document.enc_setting.a_copy.checked = false;
      document.enc_setting.ar.options[4].selected = true;  // 24k
      document.enc_setting.ab.options[6].selected = true;  // 64kbps
      document.enc_setting.cutoff.value = 12000;
    } else if ( checked_format == 'I-Frame' || checked_format == 'HighLight' ) {
      document.enc_setting.v_copy.checked = false;
      document.enc_setting.save_aspect.checked = ture;
      //document.enc_setting.s_w.value = ${vid_width};
      //document.enc_setting.s_h.value = ${vid_height};
      //document.enc_setting.r.value = ${round_fps};
      //document.enc_setting.b.value = ${default_bps};
      //document.enc_setting.deinterlace.checked = false;
      //document.enc_setting.ar.options[0].selected = true;  // Original
      //document.enc_setting.ab.options[0].selected = true;  // 192kbps
      //document.enc_setting.cutoff.value = 0;
    }
  }

  function presetVga() {
    document.enc_setting.save_aspect.checked = false;
    document.enc_setting.s_w.value = 640;
    document.enc_setting.s_h.value = 480;
    document.enc_setting.r.value = 29.97;
    document.enc_setting.b.value = 1500;
    //document.enc_setting.deinterlace.checked = false;
  }

  function presetSdwide() {
    document.enc_setting.save_aspect.checked = false;
    document.enc_setting.s_w.value = 640;
    document.enc_setting.s_h.value = 360;
    document.enc_setting.r.value = 29.97;
    document.enc_setting.b.value = 1500;
    //document.enc_setting.deinterlace.checked = false;
  }

  function preset720p() {
    document.enc_setting.save_aspect.checked = false;
    document.enc_setting.s_w.value = 1280;
    document.enc_setting.s_h.value = 720;
    document.enc_setting.r.value = 29.97;
    document.enc_setting.b.value = 4000;
    //document.enc_setting.deinterlace.checked = false;
  }

  function presetAudNormal() {
    document.enc_setting.ac[0].checked = true;  // Stereo
    document.enc_setting.ar.options[1].selected = true;  // Original
    document.enc_setting.ab.options[4].selected = true;  // 128kbps
    document.enc_setting.cutoff.value = 16000;
  }

  function presetAudHigh() {
    document.enc_setting.ac[0].checked = true;  // Stereo
    document.enc_setting.ar.options[0].selected = true;  // Original
    document.enc_setting.ab.options[1].selected = true;  // 256kbps
    document.enc_setting.cutoff.value = 18000;
  }

  function openTimerSelector(elem, sf, ef, df) {
    var size_w = 670;
    var size_h = 700;
    var pos_l = Math.floor((screen.width - size_w) / 2);
    var pos_t = Math.floor((screen.height - size_h) / 2);

    const ss = document.getElementsByName(sf)[0].value;
    const tend = document.getElementsByName(ef)[0].value;
    const vno  = getRadioButtonValue(document.enc_setting.v_map);
    const clicked = elem.name.indexOf('ss') == 0 ? "start" : "end";
    const url = "${SELECTOR_CGI}?file=${encoded_path}&dir=${dir}"
              + "&clicked=" + clicked + "&vno=" + vno
              + "&start_f=" + sf + "&end_f=" + ef + "&duration_f=" + df
              + "&ss=" + ss + "&tend=" + tend;

    var child = window.open(url, "範囲指定",
                'width='+size_w+', height='+size_h+', left='+pos_l+', top='+pos_t+', menubar=no, toolbar=no, scrollbars=yes'
               );
  }

  function addJob() {
    const ajax = jsUtils.ajax;

    ajax.init();
    ajax.setOnLoading(function() {
      document.getElementById('sStatus').innerHTML = "登録中...";
    });
    ajax.setOnSuccess(function(httpRequest) {
      document.getElementById('sStatus').innerHTML = "完了";
    });
    ajax.setOnError(function(httpRequest) {
      document.getElementById('sStatus').innerHTML = "ERROR: " + httpRequest.status;
    });
    ajax.post("$ENV{'SCRIPT_NAME'}", query);
  }
-->
</script>
EOD

  my $date_string = &get_date_string();
  print <<EOF;
<br>
<div id="dirlist"></div>
出力先: <input type="text" class="fit_width" name="out_dir" value="${date_string}" size="50"><br>
EOF
  if(opendir(DIR, $CONV_OUT_DIR)) {
    print "<select name=\"exist_dir\" size=\"5\" class=\"fit_width\" onChange=\"select_existdir()\">\n";
    while(my $entry = decode('utf-8', readdir(DIR))) {
      if( length($entry) > 0 && $entry ne '..'  && $entry ne '.' &&
          -d "$CONV_OUT_DIR/$entry" )
      {
        print "<option>".$entry."</option>\n";
      }
    }
    print "</select>\n";
    closedir(DIR);
  }

  print <<EOF;
<br><br>
<input type="hidden" name="dir" value="${dir}">
<input type="hidden" name="mode" value="encode">
<fieldset>
<legend>時間</legend>
<input type="checkbox" name="set_position" onChange="showElem(getElementById('TimeSel'), document.enc_setting.set_position)"> 出力する範囲を指定<br>
<div id="TimeSel" style="display: none">
1.位置 <input type="text" name="ss0" class="hhmmssxxx" value="00:00:00.000" onClick="openTimerSelector(this, 'ss0', 'tend0', 't0')">
 ～ <input type="text" name="tend0" class="hhmmssxxx" value="00:00:00.000" onClick="openTimerSelector(this, 'ss0', 'tend0', 't0')">
 長さ<input type="text" name="t0" class="hhmmssxxx" value="00:00:00.000" readonly>
<div id="TimeSelAddtion"></div>
<input type="button" name="add_time_sel" onClick="addTimeSel()" value="追加">
</div>
</fieldset><br>
ファイルフォーマット <select name="format" onchange="changeEncodeParameter()">
EOF
  print "<optgroup label=\"Video\">\n";
  foreach my $etype (@encode_video_types) {
    print "<option value=\"". @{$etype}[0] ."\">". @{$etype}[1] ."</option>\n";
  }
  print "</optgroup>\n";
  print "<optgroup label=\"Audio\">\n";
  foreach my $etype (@encode_audio_types) {
    print "<option value=\"". @{$etype}[0] ."\">". @{$etype}[1] ."</option>\n";
  }
  print "</optgroup>\n";
  print "<option value=\"copy\">コピー (無変換)</option>\n";
  print <<EOF;
</select><br>
<input type="checkbox" name="pass2"> 2パスエンコード<br>
<br>
<fieldset>
<legend>映像設定</legend>
<input type="checkbox" name="v_copy"> 変換しない<br>
プリセット:
<input type="button" name="preset_vga" value="SD(4:3)" onClick="presetVga()">
<input type="button" name="preset_sdwide" value="SD(16:9)" onClick="presetSdwide()">
<input type="button" name="preset_720p" value="720p" onClick="preset720p()">
<br>
<input type="checkbox" name="enable_crop" onChange="showElem(getElementById('TrimSel'), document.enc_setting.enable_crop)"> トリミング&nbsp;&nbsp;
<span id="TrimSel" style="display: none">
サイズ <input type="text" name="crop_w" onChange="print_aspect('crop')" size="5">x<input type="text" name="crop_h" onChange="print_aspect('crop')" size="5">
(比率 <span id="crop_aspect">-----</span>)
&nbsp;&nbsp;地点 <input type="text" name="crop_x" size="5">x<input type="text" name="crop_y" size="5">
<input type="button" onClick="openPreviewWindow()" value="preview">
</span>
<br>
<input type="checkbox" name="enable_pad" onChange="showElem(getElementById('PaddingSel'), document.enc_setting.enable_pad)"> Padding&nbsp;&nbsp;
<span id="PaddingSel" style="display: none">
サイズ <input type="text" name="pad_w" onChange="print_aspect('padding')" size="5">x<input type="text" name="pad_h" onChange="print_aspect('padding')" size="5">
(比率 <span id="padding_aspect">-----</span>)
&nbsp;&nbsp;地点 <input type="text" name="pad_x" size="5">x<input type="text" name="pad_y" size="5">
&nbsp;&nbsp;色 <select name="pad_color" size="1"><option selected>black</option><option>white</option><option>gray</option></select>
<input type="button" onClick="openPreviewWindow()" value="preview">
※オリジナルサイズより大きい値を指定してください
</span>
<br>
解像度 <input type="text" name="s_w" size="5" onChange="fixHeight()">x<input type="text" name="s_h" size="5" onChange="fixWidth()">
(比率 <span id="s_aspect">-----</span>)
<input type="checkbox" name="save_aspect" value="1" checked>比率を保持する<br>
縦横比 <select name="aspect_set"><option value="none">設定しない</option><option value="setsar">SAR</option><option value="setdar">DAR</option></select> 比率<input type="text" name="aspect_numerator" size="4">/<input type="text" name="aspect_denominator" size="4"><br>
フレームレート <input type="text" name="r"><br>
動画ビットレート <input type="text" name="b" size="30">kbps&nbsp;&nbsp;&nbsp;&nbsp;
(ビットレートの目安: <span id="aimed_bitrate">---- kbps</span>
&nbsp;&nbsp;動作:
<input type="radio" name="move_freq" value="high">高度
<input type="radio" name="move_freq" value="middle" checked>中度
<input type="radio" name="move_freq" value="low">低度
<input type="button" name="btn_calc_bitrate_aim" value="算出" onClick="calcBitrateAim()">)<br>
<fieldset><legend>画質調整</legend>
<input type="checkbox" name="enable_adjust" onChange="actionAdjEnable(); showElem(getElementById('adjustForm'), document.enc_setting.enable_adjust)"> 画質調整する<br>
<div id="adjustForm" style="display: none">
<img src="${GRAY_PAD}" style="float: left; margin-right: 10px;" name="adjpreview" width="320" height="240">
明るさ
<input type="button" name="bright_minus" value="&lt;" onClick="adj_brightness(-0.03)">
<input type="text" name="brightness" size="5" value="0.0">
<input type="button" name="bright_plus" value="&gt;" onClick="adj_brightness(0.03)">
<input type="button" name="bright_default" value="default:0.0" onClick="set_brightness(0.0)"> (-1〜1)<br>
コントラスト
<input type="button" name="contrast_minus" value="&lt;" onClick="adj_contrast(-0.03)">
<input type="text" name="contrast" size="5" value="1.0">
<input type="button" name="contrast_plus" value="&gt;" onClick="adj_contrast(0.03)">
<input type="button" name="contrast_default" value="default:1.0" onClick="set_contrast(1.0)">
(-2〜2)<br>
ガンマ
<input type="button" name="gamma_minus" value="&lt;" onClick="adj_gamma(-0.03)">
<input type="text" name="gamma" size="5" value="1.0">
<input type="button" name="gamma_plus" value="&gt;" onClick="adj_gamma(0.03)">
<input type="button" name="gamma_default" value="default:1.0" onClick="set_gamma(1.0)">
(0.1〜10)<br>
色相
<input type="button" name="hue_minus" value="&lt;" onClick="adj_hue(-3)">
<input type="text" name="hue" size="5" value="0.0">
<input type="button" name="hue_plus" value="&gt;" onClick="adj_hue(3)">
<input type="button" name="hue_default" value="default:0.0" onClick="set_hue(0.0)">
(-180〜180)<br>
彩度
<input type="button" name="saturation_minus" value="&lt;" onClick="adj_saturation(-0.03)">
<input type="text" name="saturation" size="5" value="1.0">
<input type="button" name="saturation_plus" value="&gt;" onClick="adj_saturation(0.03)">
<input type="button" name="saturation_default" value="default:1.0" onClick="set_saturation(1.0)">
(-10〜10)<br>
シャープ
<input type="button" name="sharp_minus" value="&lt;" onClick="adj_sharp(-0.03)">
<input type="text" name="sharp" size="5" value="1.0">
<input type="button" name="sharp_plus" value="&gt;" onClick="adj_sharp(0.03)">
<input type="button" name="sharp_default" value="default:1.0" onClick="set_sharp(1.0)">
(-1.5〜1.5)<br>
赤ガンマ
<input type="button" name="rg_minus" value="&lt;" onClick="adj_rg(-0.03)">
<input type="text" name="rg" size="5" value="1.0">
<input type="button" name="rg_plus" value="&gt;" onClick="adj_rg(0.03)">
<input type="button" name="rg_default" value="default:1.0" onClick="set_rg(1.0)">
(0.1〜10)<br>
緑ガンマ
<input type="button" name="gg_minus" value="&lt;" onClick="adj_gg(-0.03)">
<input type="text" name="gg" size="5" value="1.0">
<input type="button" name="gg_plus" value="&gt;" onClick="adj_gg(0.03)">
<input type="button" name="gg_default" value="default:1.0" onClick="set_gg(1.0)">
(0.1〜10)<br>
青ガンマ
<input type="button" name="bg_minus" value="&lt;" onClick="adj_bg(-0.03)">
<input type="text" name="bg" size="5" value="1.0">
<input type="button" name="bg_plus" value="&gt;" onClick="adj_bg(0.03)">
<input type="button" name="bg_default" value="default:1.0" onClick="set_bg(1.0)">
(0.1〜10)<br>
weight
<input type="button" name="weight_minus" value="&lt;" onClick="adj_weight(-0.03)">
<input type="text" name="weight" size="5" value="1.0">
<input type="button" name="weight_plus" value="&gt;" onClick="adj_weight(0.03)">
<input type="button" name="weight_default" value="default:1.0" onClick="set_weight(1.0)">
(0〜1)<br>
<input type="button" onClick="openPreviewWindow()" value="preview"><br>
</div>
</fieldset>
<input type="checkbox" name="deinterlace" checked> インタレース解除<br>
<input type="checkbox" name="deshake"> 手振れ低減<br>
</fieldset><br>
<fieldset>
<legend>音声設定</legend>
<input type="checkbox" name="a_copy"> 変換しない<br>
プリセット:
<input type="button" name="preset_audio_high" value="高音質" onClick="presetAudHigh()">
<input type="button" name="preset_audio_normal" value="標準" onClick="presetAudNormal()">
<br>
音声サンプリングレート <select name="ar"><option value="" selected>Original</option><option value="48000">48k</option><option value="44100">44.1k</option><option value="32000">32k</option><option value="24000">24k</option><option value="22050">22.05k</option></select>Hz<br>
音声チャンネル <input type="radio" name="ac" value="2" checked>ステレオ <input type="radio" name="ac" value="1">モノラル<br>
音声ビットレート <select name="ab"><option value="320">320</option><option value="256">256</option><option value="192">192</option><option value="160">160</option><option value="128" selected>128</option><option value="96">96</option><option value="64">64</option><option value="32">32</option></select>kbps<br>
高域カット <input type="text" name="cutoff" value="0" size="30"><br>
音量 <input type="text" name="volume" value="1.0" size="10"> ※入力からの倍率<br>
</fieldset>
<br>

<div id="sStatus"></div>
<p style="text-align: center">
<!-- <input type="button" value="変換する" onClick="addJob()"> -->
<input type="submit" value="変換する">
</p>
</form>
EOF

  HTML_Elem->tail();
}

sub get_date_string
{
  my $date_string;
  my($sec, $min, $hour, $day, $mon, $year) = localtime(time);
  $year += 1900;
  $mon += 1;
  $date_string = sprintf("%d-%02d-%02d_%02d%02d%02d", $year, $mon, $day, $hour, $min, $sec);
  return $date_string;
}

sub get_video_ratio
{
  my ($a, $b) = @_;
  while ($a != $b) {
    my $r;
    if ($a > $b) {
      $r = $a - $b;
      $a = $b;
      $b = $r;
    } else {
      $r = $b - $a;
      $b = $r;
    }
  }

  return $a;
}

sub check_capable_type
{
  my ($file) = @_;

  foreach my $type (@support_video_types) {
    if (lc($file) =~ /\.${type}$/) {
      return "video";
    }
  }
  foreach my $type (@support_audio_types) {
    if (lc($file) =~ /\.${type}$/) {
      return "audio";
    }
  }
  return "unsupported";
}
