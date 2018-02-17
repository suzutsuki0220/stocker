#!/usr/bin/perl

use strict;
use warnings;

use utf8;
#binmode(STDIN,  ":utf8");
#binmode(STDOUT, ":utf8");

use CGI;
use Encode;
use File::Path;

use lib '%libs_dir%';
use ParamPath;
use HTML_Elem;
use FileOperator;

our $BASE_DIR_CONF;
our $STOCKER_CGI;
our $TRASH_PATH;
our $TMP_FILE;
require '%conf_dir%/stocker.conf';

use lib './';
require 'edit_filefunc.pl';

my $form = eval{new CGI};
my $mode   = scalar($form->param('mode'));
my $target = scalar($form->param('target'));
my @files = $form->param('file');
my $base_name = scalar($form->param('dir'));
my $out_dir   = scalar($form->param('out_dir'));

our $base_name = HTML_Elem->url_decode(scalar($form->param('dir')));
my $encoded_dir = HTML_Elem->url_encode(encode('utf-8', $base_name));

my $up_path = ParamPath->get_up_path(ParamPath->urlpath_decode($files[0])); 
my $back_link = "${STOCKER_CGI}?file=" . ParamPath->urlpath_encode(encode('utf-8', $up_path)) . "&dir=" . $encoded_dir; 
my $exif_cmd = "/usr/local/bin/exif --tag=%%TAG%% --ifd=EXIF --set-value=%%VALUE%% --output=%%TMP_FILE%% '%%INPUT%%' 2>&1 > /dev/null";

our $path;
our $base;
eval {
  my $ins = ParamPath->new(base_dir_conf => $BASE_DIR_CONF);
  $ins->init_by_base_name(${base_name});
  $base = $ins->{base};
};
if ($@) {
  HTML_Elem->header();
  HTML_Elem->error($@);
}

if( ${mode} eq "resize" || ${mode} eq "combine" ) {
  &form_setting();
} elsif( ${mode} eq "do_resize" ) {
  &do_resize();
} elsif( ${mode} eq "do_combine" ) {
  &do_combine();
} elsif( ${mode} eq "divide") {
  &form_divide();
} elsif( ${mode} eq "do_divide"  ) {
  &do_divide();
} elsif( ${mode} eq "delfile" ) {
  &form_delete();
} elsif( ${mode} eq "do_delete" ) {
  &do_delete();
} elsif( ${mode} eq "newfolder" ) {
  &form_newfolder();
} elsif( ${mode} eq "do_newfolder" ) {
  &do_newfolder();
} elsif( ${mode} eq "upload" ) {
  &form_upload();
} elsif( ${mode} eq "do_upload" ) {
  &do_upload();
} elsif( ${mode} eq "download" ) {
  &do_download();
} elsif( ${mode} eq "rename" ) {
  &form_rename();
} elsif( ${mode} eq "do_rename" ) {
  &do_rename();
} elsif( ${mode} eq "move" ) {
  &form_move();
} elsif( ${mode} eq "do_move" ) {
  &do_move();
} else {
  HTML_Elem->header();
  HTML_Elem->error("実装されていない機能です");
}

exit(0);

#####

sub form_setting() {
  HTML_Elem->header();

  if (@files.length == 0) {
    HTML_Elem->error("ファイルが選択されていません");
  }

  foreach (@files) {
    my $entry = ParamPath->urlpath_decode($_);
    if( lc($entry) !~ /\.jpg$/  && lc($entry) !~ /\.jpeg$/ && lc($entry) !~ /\.ts$/ &&
        lc($entry) !~ /\.m2ts$/ && lc($entry) !~ /\.mts$/ )
    {
      HTML_Elem->error("この形式は変換できません。<br>$entry");
    }
  }

  ### 拡張子判定 ###
  ###  画像 .ts .m2ts .mts 以外は結合できない
  ###  結合はすべて同じ拡張子であること
  ###  画像以外は縮小できない

  my $ts_flag  = 0;
  my $img_flag = 0;
  my $cmb_ext  = "";

  foreach my $file (@files) {
    my $extention = ParamPath->urlpath_decode($file);
    $extention =~ /([^\.]{1,})$/;
    $extention = lc($1);  # change to lower string
#    if ($extention eq "jpg" || $extention eq "jpeg" || $extention eq "png" || $extention eq "bmp" || $extention eq "tiff" || $extention eq "tif") {
    if ($extention eq "jpg" || $extention eq "jpeg") {
      $img_flag = 1;
    }
    if ($extention eq "ts" || $extention eq "m2ts" || $extention eq "mts") {
      $ts_flag = 1;
    }
    if (${mode} eq "combine") {  # 結合時の同一形式チェック
      if (length($cmb_ext) <= 0) {
        $cmb_ext = $extention;
      } else {
        if ($cmb_ext ne $extention) {
          HTML_Elem->error("異なる形式を結合できません。");
        }
      }
    }
  }
  if (${mode} eq "resize" && $ts_flag) { # 縮小時の画像指定チェック
    HTML_Elem->error("動画ファイルは縮小できません");
  }

  # get image size
  my $img_width  = 0;
  my $img_height = 0;
  my $ratio = 1;
  my $x_ratio = 1;
  my $y_ratio = 1;

  if ($img_flag) {
    my $Img = new GD::Image->newFromJpeg("${base}/" . ParamPath->urlpath_decode($files[0]));
    ($img_width, $img_height) = $Img->getBounds();

    my $a = $img_width;
    my $b = $img_height;
    while ($a != $b) {
      if ($a > $b) {
        my $r = $a - $b;
        $a = $b;
        $b = $r;
      } else {
        my $r = $b - $a;
        $b = $r;
      }
    }
    $ratio = $a;
    $x_ratio = $img_width / $ratio;
    $y_ratio = $img_height / $ratio;
  }

  my($sec, $min, $hour, $day, $mon, $year) = localtime(time);
  $year += 1900;
  $mon += 1;
  my $date_string = sprintf("%d-%02d-%02d_%02d%02d%02d", $year, $mon, $day, $hour, $min, $sec);

  print <<EOD;
<script type="text/javascript">
<!--
  function confirm_resize() {
    if (document.f1.out_dir.value.length <= 0) {
      alert("出力先を設定してください。");
      return false;
    }

    if (confirm("変換します。よろしいですか？")) {
      return true;
    } else {
      return false;
    }
  }

  function changeCropForm() {
    if (document.f1.crop_on.checked) {
      document.f1.start_x.disabled = false;
      document.f1.start_y.disabled = false;
      document.f1.crop_width.disabled = false;
      document.f1.crop_height.disabled = false;
      document.f1.btn_crop_center.disabled = false;
    } else {
      document.f1.start_x.disabled = true;
      document.f1.start_y.disabled = true;
      document.f1.crop_width.disabled = true;
      document.f1.crop_height.disabled = true;
      document.f1.btn_crop_center.disabled = true;
    }
  }

  function fillFolderName(pathText) {
    document.f1.out_dir.value = pathText;
  }

  function backPage() {
    location.href = "${back_link}";
  }

  function sizeSimulate() {
    var x_ratio = $x_ratio;
    var y_ratio = $y_ratio;
    var s_width = document.f1.out_size.options[document.f1.out_size.selectedIndex].value;
    var s_height = Math.round(s_width / x_ratio * y_ratio); 
    document.getElementById('area_simulated_size').innerHTML = "縮小後サイズ(予想): "+ s_width +"x" + s_height + "&nbsp;&nbsp;比率 " + x_ratio + ":" + y_ratio;
    // 切取りサイズの初期値代入
    document.f1.start_x.value = 0;
    document.f1.start_y.value = 0;
    document.f1.crop_width.value = s_width;
    document.f1.crop_height.value = s_height;
  }

  function calCanterPoint() {
    var x_ratio = $x_ratio;
    var y_ratio = $y_ratio;
    var s_width = document.f1.out_size.options[document.f1.out_size.selectedIndex].value;
    var s_height = Math.round(s_width / x_ratio * y_ratio); 
    document.f1.start_x.value = Math.round((s_width - document.f1.crop_width.value) / 2);
    document.f1.start_y.value = Math.round((s_height - document.f1.crop_height.value) / 2);
  }
-->
</script>
EOD

  if( ${mode} eq "resize" ) {
    print "<h1>縮小版の作成</h1>\n";
  } elsif( ${mode} eq "combine" ) {
    print "<h1>画像/動画の結合</h1>\n";
  }

  print "<p>選択: ", @files.length, "ファイル</p>\n";

  print "<form action=\"$ENV{'SCRIPT_NAME'}\" name=\"f1\" method=\"POST\" onSubmit=\"return confirm_resize();\">\n";
  foreach my $file (@files) {
    print "<input type=\"hidden\" name=\"$file\" value=\"1\">\n";
    print $file ."<br>\n";
  }
  print "<br>\n";
  print "<input type=\"hidden\" name=\"file\" value=\"" . ${files}[0] . "\">\n";
  print "<input type=\"hidden\" name=\"dir\" value=\"${encoded_dir}\">\n";

  print "ディレクトリ名: \n";
  print <<EOD;
<script type="text/javascript">
<!--
var path = "${up_path}";
if( path.charAt(0) == "/" ) {
  path = path.substr(1,path.length);
}
var pathArray = path.split("/");
for( i=0 ; i<pathArray.length ; i++ ) {
  document.write("/ <a href=\\"javascript:fillFolderName('" + pathArray[i] + "')\\">" + pathArray[i] + "</a>&nbsp;");
}
-->
</script>
EOD
  print "<br>\n";
  print "出力先: <input type=\"text\" name=\"out_dir\" value=\"$date_string\" size=\"64\"><br>\n";
  if( ${mode} eq "resize" ) {
    print "<input type=\"hidden\" name=\"mode\" value=\"do_resize\">\n";
    print "画像サイズ(横幅のピクセル): <select name=\"out_size\" onChange=\"sizeSimulate()\"><option value=\"1920\">1920 (FullHD)</option><option value=\"1280\">1280 (SXGA)</option><option value=\"1024\">1024 (XGA)</option><option value=\"800\" selected>800 (SVGA)</option><option value=\"640\" selected>640 (VGA)</option><option value=\"320\">320 (QVGA)</option><option value=\"160\">160</option></select>\n";
    print "<span id=\"area_simulated_size\"></span><br>";
    print "<input type=\"checkbox\" name=\"save_exif\" value=\"1\" checked>EXIFデーターを付ける<br>\n";
    print "<input type=\"checkbox\" name=\"crop_on\" value=\"1\" onChange=\"changeCropForm()\">画像を切り取る&nbsp;&nbsp;\n";
    print "切取始点 (<input type=\"text\" name=\"start_x\" size=\"5\" value=\"0\" disabled>,<input type=\"text\" name=\"start_y\" size=\"5\" value=\"0\" disabled>)&nbsp;&nbsp;";
    print "サイズ: <input type=\"text\" name=\"crop_width\" size=\"5\" disabled>x<input type=\"text\" name=\"crop_height\" size=\"5\" disabled>&nbsp;&nbsp;";
    print "<input type=\"button\" name=\"btn_crop_center\" onClick=\"calCanterPoint()\" value=\"中央で切取るように始点を設定\" disabled>";
    print "<br>";
  } elsif( ${mode} eq "combine" ) {
    print "<input type=\"hidden\" name=\"mode\" value=\"do_combine\">\n";
    if ($ts_flag  == 1) {
      print "形式: <select name=\"type\"><option value=\"copy\">無変換 (${cmb_ext})</option><option value=\"H.264\">H.264</option></select><br>\n";
    }
    elsif ($img_flag == 1) {
      print "形式: <select name=\"type\"><option value=\"pdf\">pdf</option><option value=\"mjpeg\">motion jpeg</option></select><br>\n";
    }
  }
  print "<br>\n";
  print "<input type=\"submit\" value=\"実行\">\n";
  print "<input type=\"button\" value=\"キャンセル\" onClick=\"backPage()\">";
  print "</form>\n";

  print <<EOD;
<script type="text/javascript">
<!--
  sizeSimulate();
-->
</script>
EOD

  HTML_Elem->tail();
}

sub do_resize {
  HTML_Elem->header();

  print "<h1>ステータス</h1>\n";
  print "<p>処理が完了するまで、ブラウザを閉じないでください。</p>\n";

  if (-d "$out_dir") {
    print "<p><font color=\"red\">警告: 出力先が既に存在します。同名のファイルは上書きされます。</font></p>";
  } else {
    mkpath "$out_dir";
  }

  my $opt_strip = "";
  if ($form->param('save_exif') ne "1") {
    $opt_strip = "-auto-orient -strip";
  }

  my $opt_crop = "";
  if ($form->param('crop_on') eq "1") {
    my $crop_width  = $form->param('crop_width');
    my $crop_height = $form->param('crop_height');
    my $start_x = $form->param('start_x');
    my $start_y = $form->param('start_y');
    $opt_crop = "-crop ${crop_width}x${crop_height}+${start_x}+${start_y}";
  }

  # sort directory list and count convert images
  my @conv_list = ();
  eval {
    @conv_list = ParamPath->get_checked_list(\$form, "${base}${path}");
  };
  if ($@) {
    HTML_Elem->error( "ディレクトリのアクセスに失敗しました" );
  }
  @conv_list = sort {$a cmp $b} @conv_list;
#  @conv_list = sort {$b cmp $a} @conv_list;

  my $cnt = 1;
  foreach my $entry (@conv_list) {
    printf("%03d / %03d: ", $cnt, $#conv_list+1); $cnt++;
    print $entry, "を変換しています。<br>\n";
    system("convert \"$path/$entry\" -resize ".$form->param('out_size')." -filter Cubic ${opt_strip} ${opt_crop} -quality 90 $out_dir/$entry");
    if( $form->param('save_exif') eq "1" ) {
      # Fix width and height of exif info
      my $Img = new GD::Image->newFromJpeg("$out_dir/$entry");
      my($small_w, $small_h) = $Img->getBounds();
      my $tmp_file = "/tmp/edit_tmp_".$ENV{'UNIQUE_ID'};

      my $cmd = $exif_cmd;
      $cmd =~ s/%%INPUT%%/$out_dir\/$entry/;
      $cmd =~ s/%%TAG%%/0xa002/;  # Width
      $cmd =~ s/%%VALUE%%/$small_w/;
      $cmd =~ s/%%TMP_FILE%%/$tmp_file/;
      system($cmd);
      unlink("$out_dir/$entry");

      $cmd = $exif_cmd;
      $cmd =~ s/%%INPUT%%/$tmp_file/;
      $cmd =~ s/%%TAG%%/0xa003/;  # Height
      $cmd =~ s/%%VALUE%%/$small_h/;
      $cmd =~ s/%%TMP_FILE%%/$out_dir\/$entry/;
      system($cmd);
      unlink($tmp_file);
    }
  }
  print "<hr>\n";
  print "<p>全ての変換が完了しました。<br>";
  print "<a href=\"${back_link}\">メディアフォルダーに戻る</a>";
  print "</p>\n";

  HTML_Elem->tail();
}

sub do_combine() {
  HTML_Elem->header();

  print "<h2>複数のtsを結合します。</h2>";
  print "<p>処理が完了するまで、ブラウザを閉じないでください。</p>\n";

  if (-d "$out_dir") {
    print "<p><font color=\"red\">警告: 出力先が既に存在します。同名のファイルは上書きされます。</font></p>";
  } else {
#    mkdir "$out_dir";
    mkpath "$out_dir";
  }

  # sort directory list and count convert images
  my @conv_list = ();
  eval {
    @conv_list = ParamPath->get_checked_list($form, $path);
  };
  if ($@) {
     HTML_Elem->error( "ディレクトリのアクセスに失敗しました" );
  }
  @conv_list = sort {$a cmp $b} @conv_list;
#  @conv_list = sort {$b cmp $a} @conv_list;

  my $type = $form->param('type');
  my $cmd = "";
  if (${type} eq "copy") {
    # 動画の結合はムービーで撮った細切れTSを1ファイルにまとめることを想定
    ### 一つ一つ末尾に結合
    #  $cmd = "cat > $out_dir/combined_$conv_list[0]";
    #  system($cmd);
    #  foreach $entry (@conv_list) {
    #    printf("%03d / %03d: ", $cnt, $#conv_list+1); $cnt++;
    #    print $entry, "を結合しています。<br>\n";
    #
    #    $cmd = "cat \'$path/$entry\' >> $out_dir/combined_$conv_list[0]";
    #    system($cmd);
    #  }
    ## 単純なバイナリ結合では、シークがおかしくなるなど良くない

    # ffmpegで結合 (再エンコードしないので、全て同じ形式であること)
    $cmd = "ffmpeg -i \"concat:";
    foreach my $entry (@conv_list) {
      $cmd .= "$path/$entry|";
    }
    $cmd .= "\" -c copy \"$out_dir/combined_$conv_list[0]\"";
  } elsif (${type} eq "H.264") {
    $cmd = "ffmpeg -i \"concat:";
    foreach my $entry (@conv_list) {
      $cmd .= "$path/$entry|";
    }
    $cmd .= "\" -vcodec libx264 -sameq \"$out_dir/combined_$conv_list[0]\"";
  } elsif (${type} eq "pdf") {
    $cmd = "convert ";
    foreach my $entry (@conv_list) {
      $cmd .= "\"$path/$entry\" ";
    }
    $cmd .= "\"$out_dir/combined_$conv_list[0].pdf\"";
  } elsif (${type} eq "mjpeg") {
    my $i = 1;
    foreach my $entry (@conv_list) {
      my $link_file = sprintf("temp_%08d.jpg", $i);
      symlink("${path}/${entry}", "${out_dir}/${link_file}");
      $i++;
    }
    $cmd = "ffmpeg -y -r 0.33 -i \"${out_dir}/temp_%08d.jpg\"";
    $cmd .= " -vcodec mjpeg -sameq -vf \"scale=1280:-1\" \"$out_dir/combined_$conv_list[0].avi\"";
    system($cmd);
    until($i<=1) {
      my $link_file = sprintf("temp_%08d.jpg", $i-1);
      unlink("${out_dir}/${link_file}");
      $i--;
    }
    $cmd = "true";  # dummy command
  }

  system($cmd);
  print "<p><b>結合完了</b><br>";
  print "<a href=\"${back_link}\">メディアフォルダーに戻る</a></p>";

  HTML_Elem->tail();
}

sub form_divide() {
  HTML_Elem->header();

  if (@files.length == 0) {
    HTML_Elem->error("ファイルが選択されていません");
  }

  foreach my $entry (@files) {
    if( lc($entry) !~ /\.pdf$/ ) {
      HTML_Elem->error("この形式は変換できません。<br>$entry");
    }
  }

  print <<EOF;
<script type="text/javascript">
<!--
  function confirm_resize() {
    if (document.f1.out_dir.value.length <= 0) {
      alert("出力先を設定してください。");
      return false;
    }

    if (confirm("変換します。よろしいですか？")) {
      return true;
    } else {
      return false;
    }
  }

  function fillFolderName(pathText) {
    document.f1.out_dir.value = pathText;
  }

  function backPage() {
    location.href = "${back_link}";
  }
-->
</script>
EOF
  print "<h1>画像の分離</h1>\n";
  print "<p>選択: ", @files.length, "ファイル</p>\n";

  print "<form action=\"$ENV{'SCRIPT_NAME'}\" name=\"f1\" method=\"POST\" onSubmit=\"return confirm_resize();\">\n";
  foreach my $file (@files) {
    print "<input type=\"hidden\" name=\"$file\" value=\"1\">\n";
    print $file ."<br>\n";
  }
  print "<br>\n";
  print "<input type=\"hidden\" name=\"mode\" value=\"do_divide\">\n";
  print "<input type=\"hidden\" name=\"file\" value=\"" . ${files}[0] . "\">\n";
  print "<input type=\"hidden\" name=\"dir\" value=\"${encoded_dir}\">\n";

  print "ディレクトリ名: \n";
  print <<EOD;
<script type="text/javascript">
<!--
var path = "${up_path}";
if( path.charAt(0) == "/" ) {
  path = path.substr(1,path.length);
}
var pathArray = path.split("/");
for( i=0 ; i<pathArray.length ; i++ ) {
  document.write("/ <a href=\\"javascript:fillFolderName('" + pathArray[i] + "')\\">" + pathArray[i] + "</a>&nbsp;");
}
-->
</script>
EOD
  my($sec, $min, $hour, $day, $mon, $year) = localtime(time);
  $year += 1900;
  $mon += 1;
  my $date_string = sprintf("%d-%02d-%02d_%02d%02d%02d", $year, $mon, $day, $hour, $min, $sec);

  print "<br>\n";
  print "出力先: <input type=\"text\" name=\"out_dir\" value=\"$date_string\" size=\"64\"><br>\n";
  print "解像度: <input type=\"text\" name=\"density\" size=\"15\" value=\"200x200\"><br>\n";
  print "ページ数: <input type=\"text\" name=\"page_from\" size=\"5\" value=\"0\">～<input type=\"text\" name=\"page_to\" size=\"5\" value=\"199\">  ※0から開始<br>\n";
  print "形式: <select name=\"type\"><option value=\"jpeg\">jpeg</option><option value=\"png\">png</option><option value=\"tiff\">tiff</option></select><br>\n";
  print "<br>\n";
  print "※実行キューに入れて処理します。";
  print "<br>\n";
  print "<input type=\"submit\" value=\"実行\">\n";
  print "<input type=\"button\" value=\"キャンセル\" onClick=\"backPage()\">";
  print "</form>\n";

  print <<EOD;
<script type="text/javascript">
<!--
  sizeSimulate();
-->
</script>
EOD

  HTML_Elem->tail();
}

sub do_divide() {
  HTML_Elem->header();

  print "<h2>画像を分離します。</h2>";
  if (-d "$out_dir") {
    print "<p><font color=\"red\">警告: 出力先が既に存在します。同名のファイルは上書きされます。</font></p>";
  } else {
    mkpath "$out_dir";
  }

  # sort directory list and count convert images
  my @conv_list = ();
  eval {
    @conv_list = ParamPath->get_checked_list(\$form, "${base}${path}");
  };
  if ($@) {
    HTML_Elem->error($@);
  }
  @conv_list = sort {$a cmp $b} @conv_list;
#  @conv_list = sort {$b cmp $a} @conv_list;

  my $type = $form->param('type');
  my $ext = ".jpg";
  if (${type} eq "png") {
    $ext = ".png";
  } elsif(${type} eq "tiff") {
    $ext = ".tiff";
  }

  my $i;
  foreach my $entry (@conv_list) {
    for ($i=$form->param('page_from'); $i<=$form->param('page_to'); $i++) {
      my $cmd = "convert -density $form->param('density') \"$path/$entry\[${i}\]\" \"$out_dir/${entry}_" . sprintf("%03d", $i) . "${ext}\"";
print "CMD: $cmd<br>";
      system($cmd);
    }
  }

  print "<p><b>分離完了</b><br>";
  print "<a href=\"${back_link}\">メディアフォルダーに戻る</a></p>";

  HTML_Elem->tail();
}

exit(0);
