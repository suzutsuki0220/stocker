#!/usr/bin/perl

use strict;
use warnings;
use utf8;
use Encode;
use CGI;
use File::Path;
use XML::Simple;
use MIME::Base64::URLSafe;

use lib '%libs_dir%';
use ParamPath;
use HTML_Elem;
use ConverterJob;

our $STOCKER_CGI    = "";
our $SELECTOR_CGI   = "";
our $MOVIEIMG_CGI   = "";
our $GETFILE_CGI    = "";
our $BASE_DIR_CONF  = "";
our $SUPPORT_TYPES  = "";
our $MOVIE_INFO_CMD = "";
our $FFMPEG_CMD     = "";
our $MOVIE_IMAGE_CACHE_DIR = "";
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
my $mode = $q->param('mode');
my $in   = $q->param('in');
my $dir  = $q->param('dir');
my $out_dir = $q->param('out_dir');

my @files = ();
my $up_inode = ${in};
my $path;
my $base;
my $base_name;
eval {
  my $ins = ParamPath->new(base_dir_conf => $BASE_DIR_CONF,
                           param_dir => $q->param('dir'));
  $ins->init();
  $path = $ins->inode_to_path($q->param('in'));
  $base = $ins->{base};
  $base_name = $ins->{base_name};
};
if ($@) {
  HTML_Elem->header();
  HTML_Elem->error($@);
}

if(-f "${base}${path}") {
  # 1ファイルの指定
  my $filename;
  if ($path =~ m/(.*)\/(.*)$/) {
    $path = $1 . "/";
    $filename = $2;
  } else {
    $filename = $path;
    $path = "";
  }
  push(@files, $filename);
  $up_inode = ParamPath->get_up_path(${in});
} elsif(-d "${base}${path}") {
  # 複数ファイルの指定
  if (length($path) > 0 && $path !~ /\/$/) {
    $path .= "/";
  }
  @files = ParamPath->get_checked_list(\$q, "${base}${path}");
  @files = sort {$a cmp $b} @files;
}

if (@files.length == 0) {
  HTML_Elem->header();
  HTML_Elem->error("指定されたファイルが存在しません。");
}

my $encfile = $base . $path . $files[0];
my $encfile_inode = $up_inode ."/". (stat "${encfile}")[1];

my $mtype = &check_capable_type($encfile);
if ($mtype eq "unsupported") {
  HTML_Elem->header();
  HTML_Elem->error("対応していない形式です: $encfile");
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
      &add_encodejob("${base}${path}$_");
    }
  } elsif ($q->param('multi_editmode') eq "combine") {
    my $concat = "concat:";
    foreach (@files) {
      $concat .= "${base}${path}$_|";
    }
    &add_encodejob("$concat");
  } else {
    &add_encodejob("${base}${path}$files[0]");
  }

  print "<a href=\"${STOCKER_CGI}?in=$up_inode&dir=${dir}\">← フォルダーに戻る</a></p>";

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

  my $base64_path = urlsafe_b64encode(encode('utf-8', $path . $files[0]));
  chomp($base64_path);
  my $f_dir = HTML_Elem->url_encode(encode('utf-8', $base_name));
  chomp($f_dir);

  my $mp4_url = "${GETFILE_CGI}?file=${base64_path}&dir=${f_dir}&mime=video/mp4";
  my $thm_url = "${MOVIEIMG_CGI}?in=${encfile_inode}&dir=${dir}&size=640";
  my $mes;

  my $cmd_movie_info = "${MOVIE_INFO_CMD} %%INPUT%%";
  $cmd_movie_info =~ s/%%INPUT%%/"${encfile}"/;

  my @jslist = (
      "%htdocs_root%/converter_form.js",
      "%htdocs_root%/ajax_html_request.js",
  );
  my $html = HTML_Elem->new();
  $html->{'javascript'} = \@jslist;
  $html->header();

  $mes = <<EOF;
<a href="${STOCKER_CGI}?in=${up_inode}&dir=${dir}">← 戻る</a><br>
<h1>ファイル変換</h1>
EOF
  print encode('utf8', $mes);

  if ($mtype eq "video") {
    if (lc($files[0]) =~ /\.mp4$/ || lc($files[0]) =~ /\.m4v$/ || lc($files[0]) =~ /\.mpg4$/) {
      print "<video src=\"$mp4_url\" name=\"vimg\" id=\"player\" type=\"video/mp4\" poster=\"$thm_url\" width=\"640\" controls></video>\n";
    } else {
      print "<img src=\"$thm_url\" name=\"vimg\" width=\"640\">\n";
    }
  }
  print "<h2>変換元ファイル</h2>\n";

  foreach (@files) {
    print $path . $_ . "<br>\n";
  }

  print "<h2>情報</h2>\n";
  open (my $IN, "${cmd_movie_info} |");  # FFMpeg APIを使って情報を読み込む
  my $movie_info_xml = "";
  while(my $line = <$IN>) {
    $movie_info_xml .= $line;
  }
  close ($IN);

  my $i = 0;
  my $vid_width  = 0;
  my $vid_height = 0;
  my $vid_fps    = 0;
  my $x_ratio = 1;
  my $y_ratio = 1;
  my $disp_width = 0;
  my $init_set_width = 0;
  my $has_video_stream = undef;
  my $has_audio_stream = undef;
  my $mov_duration = 0;
  my $mov_filesize = 0;
  my $mov_format   = "";
  my $default_bps  = 0;
  my $round_fps    = 0;
  my $vimg_height  = 0;

  my $xml = XML::Simple->new(KeepRoot=>1, ForceArray=>1);
  my $movie_info;
  eval {
    $movie_info = $xml->XMLin($movie_info_xml);
  };
  if ($@) {
    print "情報取得失敗 $@";
  } else {
    $has_video_stream = $movie_info->{'movie_info'}[0]->{'video'}[0]->{'no'};
    $has_audio_stream = $movie_info->{'movie_info'}[0]->{'audio'}[0]->{'no'};

    $mov_duration = $movie_info->{'movie_info'}[0]->{'duration'}[0];
    $mov_filesize = $movie_info->{'movie_info'}[0]->{'filesize'}[0];
    $mov_format   = $movie_info->{'movie_info'}[0]->{'format'}[0];

    if ($has_video_stream) {
      $vid_width  = $movie_info->{'movie_info'}[0]->{'video'}[0]->{'disp_width'}[0];
      $vid_height = $movie_info->{'movie_info'}[0]->{'video'}[0]->{'disp_height'}[0];
      $vid_fps    = $movie_info->{'movie_info'}[0]->{'video'}[0]->{'fps'}[0];

      ($x_ratio, $y_ratio) = split(/:/, $movie_info->{'movie_info'}[0]->{'video'}[0]->{'disp_aspect'}[0]);
      $disp_width = $vid_width;
      $init_set_width = $disp_width - ($disp_width % 8);  # エンコードする時に8の倍数にする

      $default_bps = int($vid_width * $vid_height * $vid_fps * 0.125 / 1000);
      $round_fps = sprintf("%.2f", ${vid_fps});
      $vimg_height = $vid_height ? int(640 / $disp_width * $vid_height) : 1;
    }

    1 while $mov_filesize =~ s/(\d)(\d\d\d)(?!\d)/$1,$2/g;  # This code from "http://perldoc.perl.org/perlop.html"
  }

  print "<form action=\"$ENV{'SCRIPT_NAME'}\" name=\"enc_setting\" method=\"POST\" autocomplete=\"off\">";

  print "<table border=\"3\">\n";
  print "<tr><th colspan=\"3\">全般</th></tr>\n";
  print "<tr><th colspan=\"2\">時間</th><td>$mov_duration</td></tr>\n";
  print "<tr><th colspan=\"2\">ファイルサイズ</th><td>$mov_filesize Byte</td></tr>\n";
  print "<tr><th colspan=\"2\">フォーマット</th><td>$mov_format</td></tr>\n";
  if ($has_video_stream) {
    print "<tr><th colspan=\"3\">映像ストリーム</th></tr>\n";

    my $best_st = &get_best_video_stream_id(\@{$movie_info->{'movie_info'}[0]->{'video'}});
    for ($i=0; $i<@{$movie_info->{'movie_info'}[0]->{'video'}}; $i++) {
      &print_table_video(\$movie_info->{'movie_info'}[0]->{'video'}[${i}], $best_st);
    }
  }
  if ($has_audio_stream) {
    print "<tr><th colspan=\"3\">音声ストリーム</th></tr>\n";

    my $best_st = &get_best_audio_stream_id(\@{$movie_info->{'movie_info'}[0]->{'audio'}});
    for ($i=0; $i<@{$movie_info->{'movie_info'}[0]->{'audio'}}; $i++) {
      &print_table_audio(\$movie_info->{'movie_info'}[0]->{'audio'}[${i}], $best_st);
    }
  }
  print "</table>\n";

  print "<h2>変換の設定</h2>\n";
  if (@files.length() > 1) {
    print "<p><b>複数のファイルが指定されています</b><br>\n";
    print "変換方法: ";
    print "<input type=\"radio\" name=\"multi_editmode\" value=\"sameenc\" checked> 同じ設定でエンコード";
    print "&nbsp;&nbsp;";
    print "<input type=\"radio\" name=\"multi_editmode\" value=\"combine\"> 複数の動画を結合してエンコード";
    print "<br></p>\n";
  }
  foreach (@files) {
    my $inode = (stat "${base}${path}$_")[1];
    print "<input type=\"hidden\" name=\"${inode}\" value=\"1\">\n";
  }

  $mes = <<EOD;
ソースの場所: 
<script type="text/javascript">
<!--
  var path = "${path}";
  if( path.charAt(0) == "/" ) {
    path = path.substr(1,path.length);
  }
  var pathArray = path.split("/");
  for( i=0; i<pathArray.length -1; i++ ) { /* 末尾の"/"の分-1する */
    document.write("/ <a href=\\"javascript:fillFolderName('" + pathArray[i] + "')\\">" + pathArray[i] + "</a>&nbsp;");
  }

  function fillFolderName(pathText) {
    document.enc_setting.out_dir.value = pathText;
  }

EOD
  print encode('utf-8', $mes);
 
  if ($has_video_stream) {
    print <<EOD;
  document.getElementsByName('vimg')[0].style.width  = "640px";
  document.getElementsByName('vimg')[0].style.height = "${vimg_height}px";
EOD
  }

  print <<EOD;
  function get_preview_url(ss, width) {
    var url = "${MOVIEIMG_CGI}?in=${encfile_inode}&dir=${dir}&size=" + width;
    if (document.enc_setting.set_position.checked == true) {
      url += "&set_position=1";
      url += "&ss=" + ss;
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

    if( checked_format == 'dvd' ) {
      document.enc_setting.save_aspect.checked = false;
      document.enc_setting.s_w.value = 720;
      document.enc_setting.s_h.value = 480;
      document.enc_setting.r.value = 29.97;
      document.enc_setting.b.value = 5000;
      document.enc_setting.deinterlace.checked = false;
      document.enc_setting.ar.options[1].selected = true;  // 48k
      document.enc_setting.ab.options[2].selected = true;  // 192kbps
      document.enc_setting.cutoff.value = 18000;
    } else if ( checked_format == 'mpeg4' ) {
      document.enc_setting.save_aspect.checked = false;
      document.enc_setting.s_w.value = 640;
      document.enc_setting.s_h.value = 480;
      document.enc_setting.r.value = ${round_fps};
      document.enc_setting.b.value = 1024;
      //document.enc_setting.deinterlace.checked = false;
      document.enc_setting.ar.options[0].selected = true;  // Original
      document.enc_setting.ab.options[5].selected = true;  // 96kbps
      document.enc_setting.cutoff.value = 12000;
    } else if ( checked_format == 'H.264' ) {
      document.enc_setting.save_aspect.checked = false;
      document.enc_setting.s_w.value = 640;
      document.enc_setting.s_h.value = 480;
      document.enc_setting.r.value = ${round_fps};
      document.enc_setting.b.value = 1024;
      //document.enc_setting.deinterlace.checked = false;
      document.enc_setting.ar.options[0].selected = true;  // Original
      document.enc_setting.ab.options[3].selected = true;  // 160kbps
      document.enc_setting.cutoff.value = 0;
    } else if ( checked_format == 'wmv' ) {
      document.enc_setting.save_aspect.checked = true;
      document.enc_setting.s_w.value = ${vid_width};
      document.enc_setting.s_h.value = ${vid_height};
      document.enc_setting.r.value = ${round_fps};
      document.enc_setting.b.value = ${default_bps};
      //document.enc_setting.deinterlace.checked = false;
      document.enc_setting.ar.options[0].selected = true;  // Original
      document.enc_setting.ab.options[3].selected = true;  // 160kbps
      document.enc_setting.cutoff.value = 18000;
    } else if ( checked_format == 'asf' ) {
      document.enc_setting.save_aspect.checked = false;
      document.enc_setting.s_w.value = 320;
      document.enc_setting.s_h.value = 160;
      document.enc_setting.r.value = ${round_fps};
      document.enc_setting.b.value = 512;
      //document.enc_setting.deinterlace.checked = false;
      document.enc_setting.ar.options[4].selected = true;  // 24k
      document.enc_setting.ab.options[6].selected = true;  // 64kbps
      document.enc_setting.cutoff.value = 12000;
    } else if ( checked_format == 'I-Frame' || checked_format == 'HighLight' ) {
      document.enc_setting.save_aspect.checked = ture;
      document.enc_setting.s_w.value = ${vid_width};
      document.enc_setting.s_h.value = ${vid_height};
      document.enc_setting.r.value = ${round_fps};
      document.enc_setting.b.value = ${default_bps};
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
    document.enc_setting.b.value = 1024;
    //document.enc_setting.deinterlace.checked = false;
  }

  function presetSdwide() {
    document.enc_setting.save_aspect.checked = false;
    document.enc_setting.s_w.value = 640;
    document.enc_setting.s_h.value = 360;
    document.enc_setting.r.value = 29.97;
    document.enc_setting.b.value = 1024;
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

  function openTimerSelector(target, pos, sf, ef, df) {
    var size_w = 670;
    var size_h = 660;
    var pos_l = (screen.width - size_w) / 2;
    var pos_t = (screen.height - size_h) / 2;

    window.open("${SELECTOR_CGI}?in=${encfile_inode}&dir=${dir}&target=" + target + "&pos=" + pos + "&start_f=" + sf + "&end_f=" + ef + "&duration_f=" + df,
                "timersel",
                'width='+size_w+', height='+size_h+', left='+pos_l+', top='+pos_t+', menubar=no, toolbar=no, scrollbars=yes'
               );
  }

  function addJob() {
    var httpRequest = ajax_init();
    if (!httpRequest) {
      alert("中断 :( XMLHTTPインスタンスを生成できませんでした");
      return false;
    }
    ajax_set_instance(httpRequest, function() { getAddJobResult(httpRequest); });
    ajax_post(httpRequest, "$ENV{'SCRIPT_NAME'}", query);
  }

  function getAddJobResult(httpRequest) {
    try {
      if (httpRequest.readyState == 0 || httpRequest.readyState == 1 || httpRequest.readyState == 2) {
        document.getElementById('sStatus').innerHTML = "読み込み中...";
      } else if (httpRequest.readyState == 4) {
        if (httpRequest.status == 200) {
          //document.getElementById('sStatus').innerHTML = "";
          document.getElementById('sValue').innerHTML = httpRequest.responseText;
        } else {
          document.getElementById('sStatus').innerHTML = "ERROR: " + httpRequest.status;
        }
      }
    } catch(e) {
      alert("ERROR: " + e.description);
    }
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
    ssArea.setAttribute("onClick", "openTimerSelector('ss"+timeSelNum+"', document.getElementsByName('ss"+timeSelNum+"')[0].value, 'ss"+timeSelNum+"', 'tend"+timeSelNum+"', 't"+timeSelNum+"')");
    selectArea.appendChild(ssArea);
    textElem = document.createTextNode(" (時:分:秒.ミリ秒) ～ ");
    selectArea.appendChild(textElem);
    var tendArea = document.createElement("input");
    tendArea.setAttribute("type", "text");
    tendArea.setAttribute("name", "tend"+timeSelNum);
    tendArea.setAttribute("value", newValue);
    tendArea.setAttribute("onClick", "openTimerSelector('tend"+timeSelNum+"', document.getElementsByName('tend"+timeSelNum+"')[0].value, 'ss"+timeSelNum+"', 'tend"+timeSelNum+"', 't"+timeSelNum+"')");
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
-->
</script>
EOD

  my $date_string = &get_date_string();
  print <<EOF;
<br>
<div id="dirlist"></div>
出力先: <input type="text" name="out_dir" value="${date_string}" size="50"><br>
EOF
  if(opendir(DIR, $CONV_OUT_DIR)) {
    print "<select name=\"exist_dir\" size=\"5\" onChange=\"select_existdir()\">\n";
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
<input type="hidden" name="in" value="${in}">
<input type="hidden" name="dir" value="${dir}">
<input type="hidden" name="mode" value="encode">
<fieldset>
<legend>時間</legend>
<input type="checkbox" name="set_position" onChange="showElem(getElementById('TimeSel'), document.enc_setting.set_position)"> 出力する範囲を指定<br>
<div id="TimeSel" style="display: none">
開始位置 <input type="text" name="ss0" value="00:00:00.000" onClick="openTimerSelector('ss0', document.enc_setting.ss0.value, 'ss0', 'tend0', 't0')"> (時:分:秒.ミリ秒)
 ～ <input type="text" name="tend0" value="00:00:00.000" onClick="openTimerSelector('tend0', document.enc_setting.tend0.value, 'ss0', 'tend0', 't0')"> (時:分:秒.ミリ秒)
 長さ <input type="text" name="t0" value="00:00:00.000" readonly>
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
<input type="button" onClick="preview_img(document.enc_setting.ss0.value)" value="preview">
</span>
<br>
<input type="checkbox" name="enable_pad" onChange="showElem(getElementById('PaddingSel'), document.enc_setting.enable_pad)"> Padding&nbsp;&nbsp; 
<span id="PaddingSel" style="display: none">
サイズ <input type="text" name="pad_w" onChange="print_aspect('padding')" size="5">x<input type="text" name="pad_h" onChange="print_aspect('padding')" size="5">
(比率 <span id="padding_aspect">-----</span>)
&nbsp;&nbsp;地点 <input type="text" name="pad_x" size="5">x<input type="text" name="pad_y" size="5">
&nbsp;&nbsp;色 <select name="pad_color" size="1"><option selected>black</option><option>white</option><option>gray</option></select>
<input type="button" onClick="preview_img(document.enc_setting.ss0.value)" value="preview">
※オリジナルサイズより大きい値を指定してください
</span>
<br>
解像度 <input type="text" name="s_w" size="5" value="${init_set_width}" onChange="fixHeight()">x<input type="text" name="s_h" size="5" value="${vid_height}" onChange="fixWidth()">
(比率 <span id="s_aspect">-----</span>)
<input type="checkbox" name="save_aspect" value="1" checked>比率を保持する<br>
縦横比 <select name="aspect_set"><option value="none">設定しない</option><option value="setsar">SAR</option><option value="setdar">DAR</option></select> 比率<input type="text" name="aspect_numerator" size="4">/<input type="text" name="aspect_denominator" size="4"><br>
フレームレート <input type="text" name="r" value="${round_fps}"><br>
動画ビットレート <input type="text" name="b" value="${default_bps}" size="30">kbps&nbsp;&nbsp;&nbsp;&nbsp;
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
<input type="button" onClick="preview_img(document.enc_setting.ss0.value)" value="preview"><br>
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
<!-- <input type="button" value="変換する" onClick="addJob()"> -->
<input type="submit" value="変換する">
</form>
EOF

  HTML_Elem->tail();
}

sub print_table_video
{
  my ($vid_info, $checked_st) = @_;

  my $checked = "";
  if ($checked_st == $$vid_info->{'no'}[0]) {
    $checked = " checked";
  }

  my $vid_no       = $$vid_info->{'no'}[0];
  my $vid_bitrate  = $$vid_info->{'bitrate'}[0];
  my $vid_codec    = $$vid_info->{'codec'}[0];
  my $vid_fps      = $$vid_info->{'fps'}[0];
  my $vid_fps_ave  = $$vid_info->{'fps_average'}[0];
  my $vid_width    = $$vid_info->{'width'}[0];
  my $vid_height   = $$vid_info->{'height'}[0];
  my $disp_width   = $$vid_info->{'disp_width'}[0];
  my $disp_height  = $$vid_info->{'disp_height'}[0];
  my $vid_sar      = $$vid_info->{'sar'}[0];
  my $disp_aspect  = $$vid_info->{'disp_aspect'}[0];
  my $vid_gop_size = $$vid_info->{'gop_size'}[0];

  print "<tr><td rowspan=\"6\"><input type=\"radio\" name=\"v_map\" value=\"${vid_no}\"${checked}>${vid_no}</td>";
  print "<th>幅 x 高さ</th><td>${vid_width} x ${vid_height} (SAR ${vid_sar})</td></tr>\n";
  print "<tr><th>表示上のサイズ</th><td>${disp_width} x ${disp_height} (DAR ${disp_aspect})</td></tr>\n";
  print "<tr><th>ビットレート</th><td>$vid_bitrate</td></tr>\n";
  print "<tr><th>コーデック</th><td>$vid_codec</td></tr>\n";
  if($vid_fps_ave =~ /^[+-]?[\d\.]+$/) {  # if fps_ave is number
    print "<tr><th>フレームレート</th><td>$vid_fps (平均 $vid_fps_ave)</td></tr>\n";
  } else {
    print "<tr><th>フレームレート</th><td>$vid_fps</td></tr>\n";
  }
  print "<tr><th>GOP</th><td>$vid_gop_size</td></tr>\n";
}

sub print_table_audio
{
  my ($aud_info, $checked_st) = @_;

  my $checked = "";
  if ($checked_st == $$aud_info->{'no'}[0]) {
    $checked = " checked";
  }

  my $aud_no          = $$aud_info->{'no'}[0];
  my $aud_sample_rate = $$aud_info->{'sample_rate'}[0];
  my $aud_channel     = $$aud_info->{'channel'}[0];
  my $aud_bitrate     = $$aud_info->{'bitrate'}[0];
  my $aud_bits        = $$aud_info->{'sample_fmt'}[0];
  my $aud_codec       = $$aud_info->{'codec'}[0];

  print "<tr><td rowspan=\"5\"><input type=\"radio\" name=\"a_map\" value=\"${aud_no}\"${checked}>${aud_no}</td>";
  print "<th>サンプリングレート</th><td>$aud_sample_rate</td></tr>\n";
  print "<tr><th>チャンネル</th><td>$aud_channel</td></tr>\n";
  print "<tr><th>ビットレート</th><td>$aud_bitrate</td></tr>\n";
  print "<tr><th>ビット数</th><td>$aud_bits</td></tr>\n";
  print "<tr><th>コーデック</th><td>$aud_codec</td></tr>\n";
}

sub get_best_video_stream_id
{
  my ($vid_info) = @_;
  my $id = 0;

  my @array_max_pixel_idx = ();
  my @array_max_fps_idx = ();
  my $max_pixel = 0;
  my $max_fps = 0;
  my $max_bitrate = 0;

  for (my $i = 0; $i < @$vid_info; $i++) {
    my $pixel = $$vid_info[$i]->{'width'}[0] * $$vid_info[$i]->{'height'}[0];
    if ($pixel > $max_pixel) {
      $max_pixel = $pixel;
    }
  }

  for (my $i = 0; $i < @$vid_info; $i++) {
    my $pixel = $$vid_info[$i]->{'width'}[0] * $$vid_info[$i]->{'height'}[0];
    if ($max_pixel == $pixel) {
      my $fps = $$vid_info[$i]->{'fps'}[0];
      if ($fps > $max_fps) {
        $max_fps = $fps;
      }
      push(@array_max_pixel_idx, $i);
    }
  }

  foreach my $i (@array_max_pixel_idx) {
    my $fps = $$vid_info[$i]->{'fps'}[0];
    if ($fps == $max_fps) {
      my $bitrate = $$vid_info[$i]->{'bitrate'}[0];
      if ($bitrate > $max_bitrate) {
        $max_bitrate = $bitrate;
      }
      push(@array_max_fps_idx, $i);
    }
  }

  foreach my $i (@array_max_fps_idx) {
    my $bitrate = $$vid_info[$i]->{'bitrate'}[0];
    if ($bitrate == $max_bitrate) {
      $id = $$vid_info[$i]->{'no'}[0];
      last;
    }
  }

  return $id;
}

sub get_best_audio_stream_id
{
  my ($aud_info) = @_;
  my $id = 0;

  my @array_max_channel_idx = ();
  my @array_max_sample_rate_idx = ();
  my $max_channel = 0;
  my $max_sample_rate = 0;
  my $max_bitrate = 0;

  for (my $i = 0; $i < @$aud_info; $i++) {
    my $channel = $$aud_info[$i]->{'channel'}[0];
    if ($channel > $max_channel) {
      $max_channel = $channel;
    }
  }

  for (my $i = 0; $i < @$aud_info; $i++) {
    my $channel = $$aud_info[$i]->{'channel'}[0];
    if ($max_channel == $channel) {
      my $sample_rate = $$aud_info[$i]->{'sample_rate'}[0];
      if ($sample_rate > $max_sample_rate) {
        $max_sample_rate = $sample_rate;
      }
      push(@array_max_channel_idx, $i);
    }
  }

  foreach my $i (@array_max_channel_idx) {
    my $sample_rate = $$aud_info[$i]->{'sample_rate'}[0];
    if ($max_sample_rate == $sample_rate) {
      my $bitrate = $$aud_info[$i]->{'bitrate'}[0];
      if ($bitrate > $max_bitrate) {
        $max_bitrate = $bitrate;
      }
      push(@array_max_sample_rate_idx, $i);
    }
  }

  foreach my $i (@array_max_sample_rate_idx) {
    my $bitrate = $$aud_info[$i]->{'bitrate'}[0];
    if ($bitrate == $max_bitrate) {
      $id = $$aud_info[$i]->{'no'}[0];
      last;
    }
  }

  return $id;
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
