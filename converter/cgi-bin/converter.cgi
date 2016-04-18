#!/usr/bin/perl

use strict;
use warnings;
use utf8;
use Encode;
use CGI;
use File::Path;
use XML::Simple;

use lib '%libs_dir%';
use ParamPath;
use HTML_Elem;
use ConverterJob;

our $STOCKER_CGI    = "";
our $MOVIEIMG_CGI   = "";
our $BASE_DIR_CONF  = "";
our $SUPPORT_TYPES  = "";
our $MOVIE_INFO_CMD = "";
our $FFMPEG_CMD     = "";
our $MOVIE_IMAGE_CACHE_DIR = "";
our $TMP_FILE = "";
our $CONV_OUT_DIR    = "";
our $ENCODE_BATCH    = "";
our $ENCBATCH_LIST   = "";
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

if(! ${in} || length(${in}) <= 0 ) {
  HTML_Elem->header();
  HTML_Elem->error("パスが指定されていません。");
}

my @files = ();
my $up_inode = ${in};
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

if(-f "${base}${path}") {
  # 1ファイルの指定
  my $filename = "/$path";
  $filename =~ /(.*)\/([^\/]{1,})$/;
  $path = $1;
  $filename = $2;
  push(@files, $filename);
  $up_inode = ParamPath->get_up_path(${in});
} elsif(-d "${base}${path}") {
  # 複数ファイルの指定
  @files = &get_checked_list("${base}${path}");
  @files = sort {$a cmp $b} @files;
} else {
  HTML_Elem->header();
  HTML_Elem->error("指定されたファイルが存在しません。");
}

my $encfile = $base . $path ."/". $files[0];
my $encfile_inode = $up_inode ."/". (stat "${encfile}")[1];

print STDERR "DEBUG: Enc_inode[${encfile_inode}], Encfile[${encfile}]";

my $mtype = &check_capable_type($encfile);
if ($mtype eq "unsupported") {
  HTML_Elem->header();
  HTML_Elem->error("対応していない形式です: $encfile");
}

# エンコード出力先
my $out_path = $CONV_OUT_DIR ."/". ${out_dir};

if(${mode} eq "encode") {
  &perform_encode();
} elsif(${mode} eq "timesel") {
  &print_timesel();
} else {
  &print_form();
}

exit(0);

#############################

### エンコード
sub perform_encode() {
  HTML_Elem->header();
  print "<h2>エンコードします</h2>";
  print "<p>処理が完了するまで、ブラウザを閉じないでください</p>\n";

  if (-d $out_path) {
    print "<p><font color=\"red\">警告: 出力先が既に存在します。同名のファイルは上書きされます</font></p>";
  } else {
    mkpath $out_path;
  }

  if ($q->param('multi_editmode') eq "sameenc") {
    foreach (@files) {
      &add_encodejob("$path/$_");
    }
  } elsif ($q->param('multi_editmode') eq "combine") {
    my $concat = "concat:";
    foreach (@files) {
      $concat .= "$path/$_|";
    }
    &add_encodejob("$concat");
  } else {
    &add_encodejob("$path/$files[0]");
  }

  print "<a href=\"${STOCKER_CGI}?in=$up_inode&dir=${dir}\">← フォルダーに戻る</a></p>";

  HTML_Elem->tail();
}

sub add_encodejob()
{
  my ($encfile) = @_;

#  if($q->param('pass2')) {
#    &encode_file($encfile ,1);
#    &encode_file($encfile ,2);
#    add_batch("rm -f ${TMP_FILE}*");
#  } else {
#    &encode_file($encfile ,0);
#  }
#  system("echo \"${ENCODE_BATCH} > /dev/null\" |batch");

  my $job = ConverterJob->new();
  $job->{source} = $encfile;
  $job->{out_dir} = $q->param('out_dir');
  $job->{format} = $q->param('format');
  $job->{pass2} = $q->param('pass2') ? 1 : 0;
  $job->{ss} = $q->param('ss');
  $job->{t} = $q->param('t');
  $job->{v_v_map} = $q->param('v_map');
  $job->{v_v_copy} = $q->param('v_copy');
  $job->{v_enable_crop} = $q->param('enable_crop') ? 1 : 0;
  $job->{v_crop_w} = $q->param('crop_w');
  $job->{v_crop_h} = $q->param('crop_h');
  $job->{v_crop_x} = $q->param('crop_x');
  $job->{v_crop_y} = $q->param('crop_y');
  $job->{v_enable_pad} = $q->param('enable_pad') ? 1 : 0;
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
  $job->{v_enable_adjust} = $q->param('enable_adjust') ? 1 : 0;
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
  $job->{v_deinterlace} = $q->param('deinterlace') ? 1 : 0;
  $job->{v_deshake} = $q->param('deshake')? 1 : 0;
  $job->{a_a_map} = $q->param('a_map');
  $job->{a_a_copy} = $q->param('a_copy');
  $job->{a_ar} = $q->param('ar');
  $job->{a_ac} = $q->param('ac');
  $job->{a_cutoff} = $q->param('cutoff');
  $job->{a_volume} = $q->param('volume');

  $job->add();
}

sub add_batch()
{
  my ($my_cmd) = @_;
  open(OUT, ">> ${ENCBATCH_LIST}") or &error("failed to add encode batch");
  flock(OUT, 2);
  print(OUT $my_cmd."\n");
  close(OUT);
}

sub encode_file()
{
  my ($encfile, $pass) = @_;

  my $out_file = $encfile;
  my $orig_ext;
  $out_file =~ s/([^\/]{1,})\.([^\.]{0,})$//;
  $out_file = $1;
  $orig_ext = $2;
  $orig_ext =~ s/\|//g;  # for "concat mode"

#  my $resolution = $q->param('s_w') . "x" . $q->param('s_h');

  my $position = "";
  if ($q->param('set_position') && $q->param('ss') ne '00:00:00.000') {
    $position = "-ss ".$q->param('ss');

    my $ss_sec = $q->param('ss');
    $ss_sec =~ s/[:\.]//g;
    $out_file = $ss_sec."_".$out_file;
  }

  my $option = "";
  if($q->param('format') eq "copy") {
    $out_file = $out_path ."/". $out_file .".". $orig_ext;
    $option  = " -c copy ";
    $option .= &set_general_option();
  } elsif($q->param('format') eq "mts") {
    $out_file = $out_path ."/". $out_file .".mts";
    $option .= &set_general_option();
    $option .= &set_video_option("libx264", $pass);
    if (! $q->param('v_copy')) {
      $option .= " -nr 600 -mbd 2 -coder 0 -bufsize 1024k -g 15 -qmin 12";
    }
    $option .= &set_audio_option("libfdk_aac"); # best quality but less compatibility
    if (! $q->param('a_copy')) {
      $option .= " -profile:a aac_he -afterburner 1";  # additional for libfdk
    }
    $option .= " -strict experimental -f mpegts";
  } elsif($q->param('format') eq "dvd") {
    $out_file = $out_path ."/". $out_file .".mpeg";
    $option  = " -threads 2 -target ntsc-dvd ";
    $option .= &set_general_option();
    $option .= &set_video_option("mpeg2video", $pass);
    $option .= &set_audio_option("ac3");
    $option .= " -strict experimental -f dvd";
  } elsif($q->param('format') eq "mpeg4") {
    $out_file = $out_path ."/". $out_file .".mp4";
    $option .= &set_general_option();
    $option .= &set_video_option("mpeg4", $pass);
    #$option .= &set_audio_option("aac");
    $option .= &set_audio_option("libfaac");
    $option .= " -strict experimental -f mp4";
  } elsif($q->param('format') eq "H.264") {
    $out_file = $out_path ."/". $out_file .".mp4";
    $option .= &set_general_option();
    $option .= &set_video_option("libx264", $pass);
    if (! $q->param('v_copy')) {
      $option .= " -nr 600 -mbd 2 -coder 0 -bufsize 1024k -g 15 -qmin 12";
#      $option ."  -mixed-refs 1 -profile high -trellis 2 -8x8dct 1";
    }
    #$option .= &set_audio_option("aac");  # worst quality
    #$option .= &set_audio_option("libfaac"); # better
    $option .= &set_audio_option("libfdk_aac"); # best quality but less compatibility
    if (! $q->param('a_copy')) {
      $option .= " -profile:a aac_he -afterburner 1";  # additional for libfdk
    }
    $option .= " -strict experimental -f mp4";
  } elsif($q->param('format') eq "wmv") {
    $out_file = $out_path ."/". $out_file .".wmv";
    $option .= &set_general_option();
    $option .= &set_video_option("wmv2", $pass);
    $option .= &set_audio_option("wmav2");
    $option .= " -f asf";
  } elsif($q->param('format') eq "asf") {
    $out_file = $out_path ."/". $out_file .".asf";
    $option .= &set_general_option();
    $option .= &set_video_option("wmv1", $pass);
    $option .= &set_audio_option("wmav1");
    $option .= " -f asf";
  } elsif($q->param('format') eq "webm") {
    $out_file = $out_path ."/". $out_file .".webm";
    $option .= &set_general_option();
    $option .= &set_video_option("vp8", $pass);
    $option .= &set_audio_option("libvorbis");
    $option .= " -strict experimental -f webm";
  } elsif($q->param('format') eq "ogv") {
    $out_file = $out_path ."/". $out_file .".ogv";
    $option .= &set_general_option();
    $option .= &set_video_option("libtheora", $pass);
    $option .= &set_audio_option("libvorbis");
    $option .= " -strict experimental -f ogg";
  } elsif($q->param('format') eq "flac") {
    $out_file = $out_path ."/". $out_file .".flac";
    $option .= &set_general_option();
    $option .= " -vn";
    $option .= &set_audio_option("flac");
    $option .= " -f flac";
  } elsif($q->param('format') eq "wav") {
    $out_file = $out_path ."/". $out_file .".wav";
    $option .= &set_general_option();
    $option .= " -vn";
    $option .= &set_audio_option("pcm_s16le");
    $option .= " -f wav";
  } elsif($q->param('format') eq "mp3") {
    $out_file = $out_path ."/". $out_file .".mp3";
    $option .= &set_general_option();
    $option .= " -vn";
    $option .= &set_audio_option("libmp3lame");
    $option .= " -f mp3";
  } elsif($q->param('format') eq "aac") {
    $out_file = $out_path ."/". $out_file .".aac";
    $option .= &set_general_option();
    $option .= " -vn";
    $option .= &set_audio_option("libfdk_aac");
    if (! $q->param('a_copy')) {
      $option .= " -profile:a aac_he -afterburner 1";  # additional for libfdk
    }
    $option .= " -strict experimental -f mp4";
  } elsif($q->param('format') eq "I-Frame") {
    $out_file = $out_path ."/". $out_file ."-%03d.jpg";
    if($q->param('deinterlace')) {
      $option .= " -vf \"yadif=0:-1\"";
    }
    $option .= &set_general_option();
    #$option .= " -vf select=\"eq(pict_type\\,I)\",tile=8x8";
    $option .= " -r 0.5";
#    $option .= " -s $resolution";  # 解像度
  } elsif($q->param('format') eq "HighLight") {
    my $SKIP_SEC = 15;
    my $duration_sec = &get_video_duration($path);

    if($q->param('deinterlace')) {
      $option .= " -vf \"yadif=0:-1\"";
    }
    $option .= " -r 1";
#    $option .= " -s $resolution";  # 解像度
    $option .= " -vframes 1 -f image2";

    print "<hr>";
    print "<h2>エンコーダー出力</h2>";
    print "<pre>\n";

    my $pos=0;
    while ($pos <= $duration_sec) {
      my $cmd = "${FFMPEG_CMD} %%POSITION%% -i \"%%INPUT%%\" %%PASSOPT%% %%OPTION%% \"%%OUTPUT%%\"";
      my $out = $out_path ."/". sprintf("%06d_", $pos). $out_file .".jpg";
      $position = "-ss $pos";
      $cmd =~ s/%%POSITION%%/$position/;
      $cmd =~ s/%%INPUT%%/$encfile/;
      $cmd =~ s/%%OUTPUT%%/$out/;
      $cmd =~ s/%%PASS%%//;
      $cmd =~ s/%%TMP_FILE%%/$TMP_FILE/;
      $cmd =~ s/%%OPTION%%/$option/;

      print "$cmd\n";
      if($q->param('to_que')) {
        &add_batch($cmd);
      } else {
        system("$cmd 2>&1");
      }

      $pos += $SKIP_SEC;
    }
    print "\n</pre>\n";
    print "<p><b>エンコード完了</b><br>";

    print "<a href=\"${STOCKER_CGI}?in=$up_inode&dir=${dir}\">← フォルダーに戻る</a></p>";

    HTML_Elem->tail();
    return;
  }  else {
    &error('不正なフォーマットが指定されました');
  }

  my $enc_cmd = "${FFMPEG_CMD} %%POSITION%% -i \"%%INPUT%%\" %%PASSOPT%% %%OPTION%% \"%%OUTPUT%%\"";
  $enc_cmd =~ s/%%POSITION%%/$position/;
  $enc_cmd =~ s/%%INPUT%%/$encfile/;
  $enc_cmd =~ s/%%OUTPUT%%/$out_file/;
  $enc_cmd =~ s/%%OPTION%%/$option/;

  if($pass == 0) {
    $enc_cmd =~ s/%%PASSOPT%%//;
  } elsif($pass == 1) {
    my $pass_opt = "-pass 1 -passlogfile ${TMP_FILE}";
    $enc_cmd =~ s/%%PASSOPT%%/${pass_opt}/;
  } elsif($pass == 2) {
    my $pass_opt = "-pass 2 -passlogfile ${TMP_FILE}";
    $enc_cmd =~ s/%%PASSOPT%%/${pass_opt}/;
  }
  if($q->param('to_que')) {
    print "<p>エンコードキューに入れました<br>";
    print "$enc_cmd</p>";
    &add_batch($enc_cmd);
  } else {
    print "<h2>実行コマンド</h2>";
    print "<p>$enc_cmd</p>";
    print "<hr>";
    print "<h2>エンコーダー出力</h2>";
    print "<pre>";
    my $start_time = time;
    system("$enc_cmd 2>&1");
    my $enc_time = time - $start_time;
    print "エンコード時間: ". $enc_time ."秒<br><br>";
    print "</pre>";
    print "<p><b>エンコード完了</b><br>";
  }
}

### 動画情報表示
sub print_form() {
  my $GRAY_PAD = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAAAwCAIAAAAuKetIAAAAQklEQVRo3u3PAQkAAAgDMLV/mie0hSBsDdZJ6rOp5wQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBATuLGnyAnZizub2AAAAAElFTkSuQmCC";
  my $mp4_url = "media_out_mp4.cgi?in=${encfile_inode}&dir=${dir}";
  my $thm_url = "${MOVIEIMG_CGI}?in=${encfile_inode}&dir=${dir}&size=640";

   my $cmd_movie_info = "${MOVIE_INFO_CMD} %%INPUT%%";
  $cmd_movie_info =~ s/%%INPUT%%/$encfile/;

  HTML_Elem->header();

  print <<EOF;
<a href="${STOCKER_CGI}?in=${up_inode}&dir=${dir}">← 戻る</a><br>
<h1>ファイル変換</h1>
EOF

  if ($mtype eq "video") {
    if (lc($files[0]) =~ /\.mp4$/ || lc($files[0]) =~ /\.m4v$/ || lc($files[0]) =~ /\.mpg4$/) {
      print "<video src=\"$mp4_url\" name=\"vimg\" id=\"player\" type=\"video/mp4\" poster=\"$thm_url\" width=\"640\" controls></video>\n";
    } else {
      print "<img src=\"$thm_url\" name=\"vimg\" width=\"640\">\n";
    }
  }
  print "<h2>変換元ファイル</h2>\n";

  foreach (@files) {
    print $path . "/" . $_ . "<br>\n";
  }

  print "<h2>情報</h2>\n";
  open (IN, "${cmd_movie_info} |");  # FFMpeg APIを使って情報を読み込む
  my $movie_info_xml = "";
  while(my $line = <IN>) {
    $movie_info_xml .= $line;
  }
  close (IN);

  my $i = 0;
  my $xml = XML::Simple->new(KeepRoot=>1, ForceArray=>1);
  my $movie_info = $xml->XMLin($movie_info_xml);

  my $mov_duration = $movie_info->{'movie_info'}[0]->{'duration'}[0];
  my $mov_filesize = $movie_info->{'movie_info'}[0]->{'filesize'}[0];
  my $mov_format   = $movie_info->{'movie_info'}[0]->{'format'}[0];

  my $vid_width  = $movie_info->{'movie_info'}[0]->{'video'}[0]->{'disp_width'}[0];
  my $vid_height = $movie_info->{'movie_info'}[0]->{'video'}[0]->{'disp_height'}[0];
  my $vid_fps    = $movie_info->{'movie_info'}[0]->{'video'}[0]->{'fps'}[0];

  my $has_video_stream = $movie_info->{'movie_info'}[0]->{'video'}[0]->{'no'};
  my $has_audio_stream = $movie_info->{'movie_info'}[0]->{'audio'}[0]->{'no'};

  my ($x_ratio, $y_ratio) = split(/:/, $movie_info->{'movie_info'}[0]->{'video'}[0]->{'disp_aspect'}[0]);
  my $disp_width = $vid_width;
  my $init_set_width = $disp_width - ($disp_width % 8);  # エンコードする時に8の倍数にする

  1 while $mov_filesize =~ s/(\d)(\d\d\d)(?!\d)/$1,$2/g;  # This code from "http://perldoc.perl.org/perlop.html"

  print "<form action=\"$ENV{'SCRIPT_NAME'}\" name=\"enc_setting\" method=\"POST\">";

  print "<table border=\"3\">\n";
  print "<tr><th colspan=\"3\">全般</th></tr>\n";
  print "<tr><th colspan=\"2\">時間</th><td>$mov_duration</td></tr>\n";
  print "<tr><th colspan=\"2\">ファイルサイズ</th><td>$mov_filesize Byte</td></tr>\n";
  print "<tr><th colspan=\"2\">フォーマット</th><td>$mov_format</td></tr>\n";
  if ($has_video_stream) {
    print "<tr><th colspan=\"3\">映像ストリーム</th></tr>\n";
    for ($i=0; $i<@{$movie_info->{'movie_info'}[0]->{'video'}}; $i++) {
      &print_table_video(\$movie_info->{'movie_info'}[0]->{'video'}[${i}]);
    }
    print "<script>document.enc_setting.v_map[0].checked = true;</script>\n";
  }
  if ($has_audio_stream) {
    print "<tr><th colspan=\"3\">音声ストリーム</th></tr>\n";
    for ($i=0; $i<@{$movie_info->{'movie_info'}[0]->{'audio'}}; $i++) {
      &print_table_audio(\$movie_info->{'movie_info'}[0]->{'audio'}[${i}]);
    }
    print "<script>document.enc_setting.a_map[0].checked = true;</script>\n";
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
    my $inode = (stat "${base}${path}/$_")[1];
    print "<input type=\"hidden\" name=\"${inode}\" value=\"1\">\n";
  }
  print "ソースの場所: \n";

  my $default_bps = int($vid_width * $vid_height * $vid_fps * 0.125 / 1000);
  my $round_fps = sprintf("%.2f", ${vid_fps});

  my $vimg_height = $vid_height ? int(640 / $disp_width * $vid_height) : 1;
  print <<EOD;
<script type="text/javascript">
<!--
  document.getElementsByName('vimg')[0].style.width  = "640px";
  document.getElementsByName('vimg')[0].style.height = "${vimg_height}px";

  function fillFolderName(pathText) {
    document.enc_setting.out_dir.value = pathText;
  }
  var path = "${path}";
  if( path.charAt(0) == "/" ) {
    path = path.substr(1,path.length);
  }
  var pathArray = path.split("/");
  for( i=0 ; i<pathArray.length -1 ; i++ ) {  // 最後のpathArrayはファイル名のため、-1を入れる
    document.write("/ <a href=\\"javascript:fillFolderName('" + pathArray[i] + "')\\">" + pathArray[i] + "</a>&nbsp;");
  }

  function showElem(fElem, checkbox) {
    if (checkbox.checked == true) {
      fElem.style.display = "block";
    } else {
      fElem.style.display = "none";
    }
  }

  function get_preview_url(ss, width) {
    var url = "${MOVIEIMG_CGI}?in=${encfile_inode}&dir=${dir}&size=" + width;
    url += "&ss=" + ss;
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

  function preview_img(ss) {
    var url = get_preview_url(ss, 640);
    window.open(url, 'preview', 'width=640, height=500, menubar=no, scrollbar=yes');
  }

  function adjust_preview() {
    var ss = document.enc_setting.ss.value;
    var url = get_preview_url(ss, 320);
    document.adjpreview.src = url;
  }

  function actionAdjEnable() {  // 画質調整する のチェックボックス
    if(document.enc_setting.enable_adjust.checked == true) {
      adjust_preview();
    } else {
      document.adjpreview.src = "${GRAY_PAD}";
    }
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

  function select_existdir() {
    fillFolderName(document.enc_setting.exist_dir.value);
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
    document.enc_setting.b.value = 4096;
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

  function openTimerSelector(target) {
    window.open("$ENV{'SCRIPT_NAME'}?mode=timesel&in=${encfile_inode}&dir=${dir}&target=" + target,
                "timersel",
                'width=680, height=700, menubar=no, toolbar=no, scrollbars=yes'
               );
  }

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
    while(my $entry = readdir(DIR)) {
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
開始位置 <input type="text" name="ss" value="00:00:00.000"> (時:分:秒.ミリ秒)
<input type="button" onClick="openTimerSelector('ss')" value="select">
<input type="button" onClick="preview_img(document.enc_setting.ss.value)" value="preview">
<br>
長さ <input type="text" name="t" value="00:00:00.000"> (時:分:秒.ミリ秒)
<input type="button" onClick="openTimerSelector('t')" value="select">
<input type="button" onClick="preview_img(add_ss_and_t())" value="preview">
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
<input type="button" onClick="preview_img(document.enc_setting.ss.value)" value="preview">
</span>
<br>
<input type="checkbox" name="enable_pad" onChange="showElem(getElementById('PaddingSel'), document.enc_setting.enable_pad)"> Padding&nbsp;&nbsp; 
<span id="PaddingSel" style="display: none">
サイズ <input type="text" name="pad_w" onChange="print_aspect('padding')" size="5">x<input type="text" name="pad_h" onChange="print_aspect('padding')" size="5">
(比率 <span id="padding_aspect">-----</span>)
&nbsp;&nbsp;地点 <input type="text" name="pad_x" size="5">x<input type="text" name="pad_y" size="5">
&nbsp;&nbsp;色 <select name="pad_color" size="1"><option selected>black</option><option>white</option><option>gray</option></select>
<input type="button" onClick="preview_img(document.enc_setting.ss.value)" value="preview">
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
<input type="button" onClick="preview_img(document.enc_setting.ss.value)" value="preview"><br>
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

<input type="checkbox" name="to_que" checked> エンコードキューに入れる ※入れない場合はエンコードが完了するまで、ブラウザのウィンドウを閉じないでください。<br>
<input type="submit" value="変換する">
</form>
EOF

  HTML_Elem->tail();
}

sub print_table_video
{
  my ($vid_info) = @_;

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

  print "<tr><th rowspan=\"6\"><input type=\"radio\" name=\"v_map\" value=\"${vid_no}\"></th>";
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
  my ($aud_info) = @_;

  my $aud_no          = $$aud_info->{'no'}[0];
  my $aud_sample_rate = $$aud_info->{'sample_rate'}[0];
  my $aud_channel     = $$aud_info->{'channel'}[0];
  my $aud_bitrate     = $$aud_info->{'bitrate'}[0];
  my $aud_bits        = $$aud_info->{'sample_fmt'}[0];
  my $aud_codec       = $$aud_info->{'codec'}[0];

  print "<tr><th rowspan=\"5\"><input type=\"radio\" name=\"a_map\" value=\"${aud_no}\"></th>";
  print "<th>サンプリングレート</th><td>$aud_sample_rate</td></tr>\n";
  print "<tr><th>チャンネル</th><td>$aud_channel</td></tr>\n";
  print "<tr><th>ビットレート</th><td>$aud_bitrate</td></tr>\n";
  print "<tr><th>ビット数</th><td>$aud_bits</td></tr>\n";
  print "<tr><th>コーデック</th><td>$aud_codec</td></tr>\n";
}

sub print_timesel
{
  HTML_Elem->header('timer selector');

  my $target = $q->param('target') eq 't' ? "t" : "ss";
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
    print "<img src=\"${MOVIEIMG_CGI}?in=${encfile_inode}&dir=${dir}&size=120&ss=${timestr}\">";
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

sub get_video_duration
{
  my ($filename) = @_;

  my $cmd_movie_info = "${MOVIE_INFO_CMD} %%INPUT%%";
  $cmd_movie_info =~ s/%%INPUT%%/$encfile/;

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

sub set_general_option
{
  my $general_option = "";
  $general_option .= " -y";

#  privent unspecified sample format ERROR
#  $general_option .= " -analyzeduration 30M -probesize 30M";

  if ($q->param('set_position') && $q->param('t') ne '00:00:00.000') {
    $general_option .= " -t ".$q->param('t');
  }

  return $general_option;
}

sub set_video_option
{
  my ($codec, $pass) = @_;

  my @vf_option = ();
  my $video_option = "";
  $video_option .= " -map 0:".$q->param('v_map');

  # 無変換オプション
  if ($q->param('v_copy')) {
    $video_option .= " -c:v copy";
    return $video_option;
  }

  $video_option .= " -c:v ${codec}";

  #$video_option .= " -s ". $q->param('s_w') . "x" . $q->param('s_h');  # 解像度
  #$video_option .= " -b ".$q->param('b')."k";    # 動画ビットレート
  $video_option .= " -b:v ".$q->param('b')."k";    # 動画ビットレート
  $video_option .= " -r ".$q->param('r');     # フレームレート

  if($q->param('deinterlace')) {
    #$video_option .= " -deinterlace -top -1";
    push(@vf_option, "yadif=0:-1");
  }
  if($q->param('deshake')) {
#    push(@vf_option, "deshake=rx=64:ry=64,crop=9/10*in_w:9/10*in_h");
    if ($pass == 1) {
      push(@vf_option, "vidstabdetect=shakiness=10:accuracy=15:result=\"${TMP_FILE}.stabilize.trf\"");
    } elsif ($pass == 2) {
      push(@vf_option, "vidstabtransform=zoom=5:input=\"${TMP_FILE}.stabilize.trf\"");
    }
  }
  if($q->param('enable_crop')) {
    push(@vf_option, "crop=".$q->param('crop_w').":".$q->param('crop_h').":".$q->param('crop_x').":".$q->param('crop_y'));
  }
  if($q->param('enable_pad')) {
    push(@vf_option, "pad=".$q->param('pad_w').":".$q->param('pad_h').":".$q->param('pad_x').":".$q->param('pad_y').":".$q->param('pad_color'));
  }
  if ($q->param('enable_adjust')) {
    push(@vf_option, "mp=eq2=".$q->param('gamma').":".$q->param('contrast').":".$q->param('brightness').":1.0:".$q->param('rg').":".$q->param('gg').":".$q->param('bg').":".$q->param('weight'));
    push(@vf_option, "hue=h=".$q->param('hue').":s=".$q->param('saturation'));
    push(@vf_option, "unsharp=3:3:".$q->param('sharp'));
  }
  push(@vf_option, "scale=".$q->param('s_w').":".$q->param('s_h'));

  my $numerator   = $q->param('aspect_numerator');
  my $denominator = $q->param('aspect_denominator');

  if ($q->param('aspect_set') eq "setsar") {
    push(@vf_option, "setsar=ratio=${numerator}/${denominator}:max=1000");
  } elsif ($q->param('aspect_set') eq "setdar") {
    push(@vf_option, "setdar=ratio=${numerator}/${denominator}:max=1000");
  }

  if ($#vf_option >= 0) {
    $video_option .= " -vf \"";
    foreach (@vf_option) {
      $video_option .= $_ . ",";
    }
    $video_option =~ s/,$/\"/;
  }

  return $video_option;
}

sub set_audio_option
{
  my ($codec) = @_;

  my $audio_option = "";
  $audio_option .= " -map 0:".$q->param('a_map');

  # 無変換オプション
  if ($q->param('a_copy')) {
    $audio_option .= " -c:a copy";
    return $audio_option;
  }

  $audio_option .= " -c:a ".${codec};
  $audio_option .= " -ac ".$q->param('ac') if ($q->param('ac'));   # 音声チャンネル
  $audio_option .= " -ar ".$q->param('ar') if ($q->param('ar'));   # 音声サンプリングレート
  if (! &is_lossless(${codec})) {
    #$audio_option .= " -ab ".$q->param('ab')."k";  # 音声ビットレート
    $audio_option .= " -b:a ".$q->param('ab')."k";  # 音声ビットレート
  }
  if($q->param('cutoff') ne "0") {
    $audio_option .= " -cutoff ".$q->param('cutoff');  # 高域カット
  }

  my @af_option = ();
  if($q->param('volume') ne "1.0") {
    push(@af_option, "volume=".$q->param('volume'));  # 音量
  }
  if($#af_option >= 0) {
    $audio_option .= " -af \"";
    foreach (@af_option) {
      $audio_option .= $_ . ",";
    }
    $audio_option =~ s/,$/\"/;
  }

  return $audio_option;
}

sub is_lossless
{
  my ($codec) = @_;

  if ("${codec}" eq 'flac') {
    return 1;
  } elsif ("${codec}" =~ /^pcm_/) {
    return 1;
  }
  return 0;
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
