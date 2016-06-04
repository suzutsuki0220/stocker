#!/usr/bin/perl

use strict;
use warnings;
use utf8;
use CGI;
use Encode;

use lib '%libs_dir%';
use ParamPath;
use HTML_Elem;
use FileOperator;

our $BASE_DIR_CONF;
our $BOX_WIDTH;
our $BOX_HEIGHT;
our $BOX_SPACE;
our $BOXES_DEFAULT;
our $MAX_DISPLAY_NAME;
our ($EDIT_CGI, $CONVERTER_CGI, $MUSIC_PLAYER_CGI, $GPS_VIEWER_CGI);
our ($TEXT_VIEWER_CGI, $PICTURE_VIEWER_CGI, $GET_THUMBNAIL_CGI, $DOWNLOAD_CGI);
our ($ICON_VIDEO, $ICON_PICTURE, $ICON_AUDIO, $ICON_TEXT, $ICON_PDF, $ICON_MAP);
our ($ICON_MS_WORD, $ICON_MS_EXCEL, $ICON_MS_POWERPOINT);
our ($ICON_UNKNOWN, $ICON_DIRECTORY);
require '%conf_dir%/stocker.conf';

my $form = eval{new CGI};
my $in_dir    = $form->param('dir');
my $in_in     = $form->param('in');
my $in_search = decode('utf-8', $form->param('search'));
my $in_from   = $form->param('from');
my $in_to     = $form->param('to');
my $in_s_width  = $form->param('s_width');
my $in_s_height = $form->param('s_height');

my $script = $ENV{'SCRIPT_NAME'};

my $path;
my $base;
my $base_name;
eval {
  my $ins = ParamPath->new(base_dir_conf => $BASE_DIR_CONF,
                           param_dir => $form->param('dir'));
  $ins->init();
  $path = $ins->inode_to_path($in_in);
  $base = $ins->{base};
  $base_name = $ins->{base_name};
};
if ($@) {
  HTML_Elem->header();
  HTML_Elem->error($@);
}

#### ディレクトリ一覧 ####
$path =~ /([^\/]{1,})$/;
HTML_Elem->header($1); # 直下のディレクトリ名をタイトルにする

opendir(my $DIR, "${base}${path}") or HTML_Elem->error("ディレクトリのopenに失敗しました - ${path}");

### スクリーンサイズに合わせてアイコン表示数を変える ###
if( ! $in_s_width || ! $in_s_height ) {
print <<EOF;
<form action="${script}" name="f1" method="POST">
<input type="hidden" name="s_width" value="">
<input type="hidden" name="s_height" value="">
<input type="hidden" name="dir" value="${in_dir}">
<input type="hidden" name="in" value="${in_in}">
<input type="hidden" name="search" value="${in_search}">
<input type="hidden" name="from" value="${in_from}">
<input type="hidden" name="to" value="${in_to}">
</form>
<script type="text/javascript">
<!--
  document.f1.s_width.value = document.documentElement.clientWidth;
  document.f1.s_height.value = document.documentElement.clientHeight;
  if(! document.f1.s_width.value || ! document.f1.s_height.value) {
    document.f1.s_width.value = 640;
    document.f1.s_height.value = 480;
  }
  document.f1.submit();
-->
</script>
EOF

  HTML_Elem->tail();
  exit(0);
}

my $boxes = $BOXES_DEFAULT;
my $disp_box_x = int(${in_s_width} / (int($BOX_WIDTH) + int($BOX_SPACE)));    # 横に表示出来る数
my $disp_box_y = int(${in_s_height} / (int($BOX_HEIGHT) + int($BOX_SPACE)));  # 縦に表示出来る数

$boxes = $disp_box_x * $disp_box_y * 3;  # 3スクロール分
if ($in_to eq '') { $in_to = $boxes; }

print "<form action=\"${script}\" name=\"file_check\" method=\"POST\">\n";
print "<input type=\"hidden\" name=\"mode\" value=\"\">\n";
print "<input type=\"hidden\" name=\"in\" value=\"${in_in}\">\n";
print "<input type=\"hidden\" name=\"dir\" value=\"${in_dir}\">\n";
print "<input type=\"hidden\" name=\"from\" value=\"0\">\n";
print "<input type=\"hidden\" name=\"to\" value=\"$boxes\">\n";
print "<input type=\"hidden\" name=\"s_width\" value=\"${in_s_width}\">\n";
print "<input type=\"hidden\" name=\"s_height\" value=\"${in_s_height}\">\n";
print "<div id=\"editParam\"></div>\n";
print "ディレクトリ: ";
print "<select name=\"fm_dir\" size=\"1\" onChange=\"changeDirectory()\">\n";

eval {
  my $ins = ParamPath->new(base_dir_conf => $BASE_DIR_CONF,
                           param_dir => $form->param('dir'));
  $ins->init();
  for (my $i=0; $i<$ins->base_dirs_count(); $i++) {
    my $lst = $ins->get_base_dir_column($i);
    if ($in_dir eq @{$lst}[1]) {
      print "<option value=\"@{$lst}[1]\" selected>".@{$lst}[0]."</option>\n";
    } else {
      print "<option value=\"@{$lst}[1]\">".@{$lst}[0]."</option>\n";
    }
  }
};
print "</select>\n";

if( $in_in && length($in_in) > 0 ) {
  print <<EOD;
<script type="text/javascript">
<!--
var path = "${path}";
var inum = "${in_in}";
if( path.charAt(0) == "/" ) {
  path = path.substr(1,path.length);
}
if( inum.charAt(0) == "/" ) {
  inum = inum.substr(1,inum.length);
}
var pathArray = path.split("/");
var inumArray = inum.split("/");
for( i=0 ; i<pathArray.length ; i++ ) {
  var paInum = "";
  for( j=0 ; j<=i ; j++ ) {
    paInum += "/" + inumArray[j];
  }
  document.write("/ <a href=\\\"$script?in=" + paInum + "&dir=${in_dir}&s_width=${in_s_width}&s_height=$in_s_height}&to=$boxes\\\">" + pathArray[i] + "</a>&nbsp;");
}
-->
</script>
EOD
  }

print "<div style=\"clear: both\">";
print "<span style=\"float: left\">\n";
print "<input type=\"text\" name=\"search\" size=\"20\" maxlength=\"64\" value=\"${in_search}\">\n";
print "<input type=\"submit\" value=\"表示絞込み\">\n";
print "</span>\n";
print "<span style=\"float: right\">\n";
&print_action();
print "</span></div>\n";

print "<div style=\"clear: both\">";
if( $in_in && length($in_in) > 0 ) {
  my $up_path = ParamPath->get_up_path(${in_in});
  print "<a href=\"$script?in=". $up_path ."&dir=${in_dir}&s_width=${in_s_width}&s_height=${in_s_height}&to=$boxes\">↑UP</a>\n";
}
  print "</div>\n";

my @dir_list = ();
while (my $entry = decode('utf-8', readdir $DIR)) {
  if( length($entry) > 0 && $entry ne '..'  && $entry !~ /^\./ && $entry ne 'lost+found') {
    # 絞込みが指定された場合、マッチしない物はリストに入れない
    if( ${in_search} && $entry !~ /${in_search}/i ) {
      next;
    }
    push(@dir_list, $entry);
  }
}
@dir_list = sort {$a cmp $b} @dir_list;

my @un_visible_list = ();
my @visible_list = ();
my $content_cnt = 0;
my $cont_from = 0;
if(length(${in_from}) > 0 && ${in_from} > 0) {
  $cont_from = ${in_from};
}

my $cont_to = $#dir_list;
if(length(${in_to}) > 0 && ${in_to} > 0) {
  $cont_to = $in_to -1;
}

if($#dir_list > $cont_to - $cont_from || $#dir_list < $cont_from) {
  &show_pagelink(@dir_list);
  &show_prev_pagelink(@dir_list);
}

### ディレクトリ内のentry表示
foreach my $entry (@dir_list) {
  my $inode = ${in_in} ."/". (stat "${base}${path}/${entry}")[1];
  if ($content_cnt >= $cont_from && $content_cnt <= $cont_to) {
    if( -d "${base}${path}/${entry}" ) {
      # ディレクトリ
      my $icon   = $ICON_DIRECTORY;
      my $action = "$script?in=$inode&dir=${in_dir}&s_width=${in_s_width}&s_height=${in_s_height}&to=$boxes";
      &print_icon(${base}.${path}, $entry, $icon, $action);
    } elsif( -f "${base}${path}/${entry}" ) {
      if( lc($entry) =~ /\.avi$/ || lc($entry) =~ /\.flv$/  || lc($entry) =~ /\.mov$/ ||
          lc($entry) =~ /\.mpg$/ || lc($entry) =~ /\.mpeg$/ || lc($entry) =~ /\.m2p$/ ||
          lc($entry) =~ /\.ts$/  || lc($entry) =~ /\.mts$/  || lc($entry) =~ /\.m2ts$/ ||
          lc($entry) =~ /\.mp4$/ || lc($entry) =~ /\.m4v$/ || lc($entry) =~ /\.mpg4$/ ||
          lc($entry) =~ /\.asf$/ || lc($entry) =~ /\.wmv$/
        )
      {
        my $icon   = "${GET_THUMBNAIL_CGI}?in=$inode&dir=${in_dir}";
        my $action = "${CONVERTER_CGI}?in=$inode&dir=${in_dir}&s_width=${in_s_width}";
        &print_icon(${base}.${path}, $entry, $icon, $action);
      } elsif( lc($entry) =~ /\.jpg$/ || lc($entry) =~ /\.jpeg$/ ) {
        my $icon   = "${GET_THUMBNAIL_CGI}?in=$inode&dir=${in_dir}";
        my $action = "${PICTURE_VIEWER_CGI}?in=$inode&dir=${in_dir}";
        &print_icon(${base}.${path}, $entry, $icon, $action);
      } elsif( lc($entry) =~ /\.txt$/ || lc($entry) =~ /\.log$/ ) {
        my $icon   = $ICON_TEXT;
        my $action = "${TEXT_VIEWER_CGI}?in=$inode&dir=${in_dir}";
        &print_icon(${base}.${path}, $entry, $icon, $action);
      } elsif( lc($entry) =~ /\.pdf$/ ) {
        my $icon   = $ICON_PDF;
        my $action = "${DOWNLOAD_CGI}?in=$inode&dir=${in_dir}";
        &print_icon(${base}.${path}, $entry, $icon, $action);
      } elsif( lc($entry) =~ /\.doc$/ || lc($entry) =~ /\.dot$/ || lc($entry) =~ /\.docx$/ ) {
        my $icon   = $ICON_MS_WORD;
        my $action = "${DOWNLOAD_CGI}?in=$inode&dir=${in_dir}";
        &print_icon(${base}.${path}, $entry, $icon, $action);
      } elsif( lc($entry) =~ /\.xls$/ || lc($entry) =~ /\.xlsx$/ ) {
        my $icon   = $ICON_MS_EXCEL;
        my $action = "${DOWNLOAD_CGI}?in=$inode&dir=${in_dir}";
        &print_icon(${base}.${path}, $entry, $icon, $action);
      } elsif( lc($entry) =~ /\.ppt$/ || lc($entry) =~ /\.pptx$/ ) {
        my $icon   = $ICON_MS_POWERPOINT;
        my $action = "${DOWNLOAD_CGI}?in=$inode&dir=${in_dir}";
        &print_icon(${base}.${path}, $entry, $icon, $action);
      } elsif( lc($entry) =~ /\.mp3$/ || lc($entry) =~ /\.wma$/ || lc($entry) =~ /\.wav$/ || lc($entry) =~ /\.flac$/ ) {
        my $icon   = $ICON_AUDIO;
        my $action = "${MUSIC_PLAYER_CGI}?in=$inode&dir=${in_dir}";
        &print_icon(${base}.${path}, $entry, $icon, $action);
      } elsif( lc($entry) =~ /\.kml$/ || lc($entry) =~ /\.kmz$/ || lc($entry) =~ /\.gpx$/ || lc($entry) =~ /\.nmea$/ ) {
        my $icon   = $ICON_MAP;
        my $action = "${GPS_VIEWER_CGI}?in=$inode&dir=${in_dir}";
        &print_icon(${base}.${path}, $entry, $icon, $action);
      } else {
        my $icon   = $ICON_UNKNOWN;
        my $action = "${DOWNLOAD_CGI}?in=$inode&dir=${in_dir}";
        &print_icon(${base}.${path}, $entry, $icon, $action);
      }
    }
    push(@visible_list, (stat "${base}$path/$entry")[1]);
  } else {
    # 画面には表示されていないファイルのcheckbox
    push(@un_visible_list, (stat "${base}${path}/$entry")[1]);
    print "<input type=\"hidden\" name=\"". (stat "${base}${path}/$entry")[1] ."\" value=\"0\">\n";
  }
  $content_cnt++;
}
print "<p class=\"partition\">&nbsp;</p>\n";

if($#dir_list > $cont_to - $cont_from || $#dir_list < $cont_from) {
  &show_next_pagelink(@dir_list);
  print "<br><br>\n";  # ページ下の余白
}

my @checked_list = ParamPath->get_checked_list(\$form, "${base}${path}");

print "</form>\n";
print "<script type=\"text/javascript\">\n";
print "<!--\n";
foreach my $checked (@checked_list) {
  my $checked_in = (stat("${base}${path}/${checked}"))[1];
  if (&contain($checked_in, \@visible_list)) {
    print "  document.getElementsByName('" . $checked_in . "')[0].checked = true;\n";  # checkbox
  } elsif (&contain($checked_in, \@un_visible_list)) {
    print "  document.getElementsByName('" . $checked_in . "')[0].value = 1;\n";  # hidden属性
  }
}
print "function allImgCheck() {\n";
foreach (@visible_list) {
  print "  document.getElementsByName('" . $_ . "')[0].checked = true;\n";
}
foreach (@un_visible_list) {
  print "  document.getElementsByName('" . $_ . "').value = 1;\n";
}
print "}\n";
print "function allImgUnCheck() {\n";
foreach (@visible_list) {
  print "  document.getElementsByName('" . $_ . "')[0].checked = false;\n";
}
foreach (@un_visible_list) {
  print "  document.getElementsByName('" . $_ . "').value = 0;\n";
}
print "}\n";
print <<EOF;
function changeDirectory() {
  document.file_check.dir.value = document.file_check.fm_dir.value;
  document.file_check.in.value = "";
  document.file_check.submit();
}
function jump_to(from, to) {
  document.file_check.from.value = from;
  document.file_check.to.value = to;
  document.file_check.submit();
}
function jump_select() {
  document.file_check.from.value = document.getElementsByName('boxval')[0].value - $boxes;
  document.file_check.to.value = document.getElementsByName('boxval')[0].value;
  document.file_check.submit();
}
EOF
print "-->\n";
print "</script>\n";
closedir($DIR);

&print_disk_space("$base");
HTML_Elem->tail();

exit(0);

######

# ページリンクの表示
sub show_pagelink {
  my (@dir_list) = @_;
  my $prev_from = $cont_from - $boxes;
  my $prev_to = $cont_from;
  print "<p style=\"text-align: center\">\n";
  if($prev_from >= 0) {
    print "<a href=\"javascript:jump_to($prev_from, $prev_to)\">← 前</a>";
  } else {
    print "← 前";
  }
  print "&nbsp;";

  my $pg = 1;
  print "<select name=\"boxval\" onChange=\"jump_select()\">\n";
  for(my $i=0;$i<=$#dir_list;$i=$i+$boxes) {
    my $tt = $i + $boxes;
    if($i>=$cont_from && $i < $cont_from + $boxes) {
      print "<option value=\"$tt\" selected>$pg Page (". ($i+1) ."-$tt)</option>\n";
    } else {
      print "<option value=\"$tt\">$pg Page (". ($i+1) ."-$tt)</option>\n";
    }
    $pg++;
  }
  print "</select>\n";
  print "&nbsp;";
  my $next_from = $cont_to +1;
  my $next_to = $cont_to + $boxes + 1;
  if($cont_to < $#dir_list) {
    print "<a href=\"javascript:jump_to($next_from, $next_to)\">次 →</a>";
  } else {
    print "次 →";
  }
  print "</p>\n";
  print <<EOF;
EOF
}

# 前ページリンクの表示
sub show_prev_pagelink {
  my (@dir_list) = @_;
  my $prev_from = $cont_from - $boxes;
  my $prev_to = $cont_from;
  if($prev_from >= 0) {
    print "<p style=\"text-align: center\">\n";
    print "<a href=\"javascript:jump_to($prev_from, $prev_to)\">前ページ</a>";
    print "</p>\n";
  }
}

# 次ページへのリンク表示
sub show_next_pagelink {
   my (@dir_list) = @_;
  print "<p style=\"text-align: center\">\n";
  my $next_from = $cont_to +1;
  my $next_to = $cont_to + $boxes + 1;
  if($cont_to < $#dir_list) {
    print "<a href=\"javascript:jump_to($next_from, $next_to)\">次ページ</a>";
  } else {
    print "以上";
  }
  print "</p>\n";
}

## アイコン表示
sub print_icon
{
  my ($path, $name, $icon, $action) = @_;

  my $inode = (stat "$path/$name")[1];
  my ($f_min, $f_hour, $f_mday, $f_mon, $f_year) = (localtime((stat("$path/$name"))[9]))[1..5];
  $f_year -= 100 if $f_year>=100;  $f_mon += 1;
  my $last_mod = sprintf("%02d/%02d/%02d %02d:%02d", $f_year, $f_mon, $f_mday, $f_hour, $f_min);

  my $size = "";
  if (-f "${path}/${name}") {
    $size = FileOperator->getDisplayFileSize("${path}/${name}");
  } #elsif (-d "${path}/${name}") {
#    $size = `du -h --max-depth=0 \"$path/$name\" | sed -e \"s/[ \\t].\\+//\"`;
#  }

  my $f_name = $name;
  if (length($f_name) > ${MAX_DISPLAY_NAME}) {
    utf8::decode($f_name);
    $f_name = substr($f_name, 0, ${MAX_DISPLAY_NAME}-length("..."));
    $f_name .= "...";
    utf8::encode($f_name);
  }
  print <<EOF;
<div class="imagebox" style="width: ${BOX_WIDTH}px; height: ${BOX_HEIGHT}px">
<p class="image" style="width: ${BOX_WIDTH}px; height: 75px">
<a href="${action}"><img src="${icon}"></p>
<span style="position: absolute; top: 3px; right: 3px;">
<input type="checkbox" name="${inode}" value="1">
</span>
<p class="caption">
<a href="${action}">$f_name</a><br>
$size<br>$last_mod
</p></div>
EOF

  return;
}

## ディスク容量表示
sub print_disk_space
{
  my ($dir) = @_;
  my ($size, $use, $remain, $rate) = FileOperator->getDiskSpace($dir);
  print <<EOF;
<hr>
<div style="text-align: right; font-size: 9pt">
容量: ${size} [使用: ${use}(${rate}) / 残り: ${remain}]<br>
</div>
EOF
}

## 操作
sub print_action
{
  print <<EOF;
操作:
<select name="operation" size="1" onChange="act()">
<option value="nop">-- 操作を選択 --</option>
<optgroup label="選択">
<option value="allCheck">全項目選択</option>
<option value="allUnCheck">全ての選択を解除</option>
</optgroup>
<optgroup label="編集">
<option value="resize">縮小版を作成</option>
<option value="convert">変換</option>
<option value="combine">画像/動画を結合</option>
<option value="divide">画像を分離</option>
</optgroup>
<optgroup label="操作">
<option value="newfolder">新規フォルダー作成</option>
<option value="upload">アップロード</option>
<option value="download">ダウンロード</option>
<option value="delfile">削除</option>
<option value="rename">名前の変更</option>
<option value="move">移動</option>
</optgroup>
</select>
<script type="text/javascript">
<!--
function act() {
  var sw = document.file_check.operation.value;
  document.file_check.operation.options[0].selected = true;  // 変更後はnopに
  switch (sw) {
    case "allCheck":
      allImgCheck();
      break;
    case "allUnCheck":
      allImgUnCheck();
      break;
    case "resize":
      document.file_check.mode.value = "resize";
      document.file_check.action = "${EDIT_CGI}";
      document.file_check.submit();
      break;
    case "convert":
      document.file_check.mode.value = "convert";
      document.file_check.action = "${CONVERTER_CGI}";
      document.file_check.submit();
      break;
    case "combine":
      document.file_check.mode.value = "combine";
      document.file_check.action = "${EDIT_CGI}";
      document.file_check.submit();
      break;
    case "divide":
      document.file_check.mode.value = "divide";
      document.file_check.action = "${EDIT_CGI}";
      document.file_check.submit();
      break;
    case "newfolder":
      document.file_check.mode.value = "newfolder";
      document.file_check.action = "${EDIT_CGI}";
      document.file_check.submit();
      break;
    case "upload":
      document.file_check.mode.value = "upload";
      document.file_check.action = "${EDIT_CGI}";
      document.file_check.submit();
      break;
    case "download":
      document.file_check.mode.value = "download";
      document.file_check.action = "${EDIT_CGI}";
      document.file_check.submit();
      break;
    case "delfile":
      document.file_check.mode.value = "delfile";
      document.file_check.action = "${EDIT_CGI}";
      document.file_check.submit();
      break;
    case "rename":
      document.file_check.mode.value = "rename";
      document.file_check.action = "${EDIT_CGI}";
      document.file_check.submit();
      break;
    case "move":
      var elem = document.createElement("f_dest");
      elem.innerHTML = '<input type="hidden" name="f_dest" value="${in_in}">'
                     + '<input type="hidden" name="f_dest_dir" value="${in_dir}">';
      document.getElementById("editParam").appendChild(elem);
      document.file_check.mode.value = "move";
      document.file_check.action = "${EDIT_CGI}";
      document.file_check.submit();
      break;
  }
}
-->
</script>
EOF
}

## 要素が存在するか

sub contain
{
  my ($key, $list) = @_;
  foreach (@$list) {
    return 1 if ($key eq $_);
  }

  return 0;
}
