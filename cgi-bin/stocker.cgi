#!/usr/bin/perl

use strict;
use warnings;
use utf8;
use CGI;
use Encode;

use lib '%libs_dir%';
use ParamPath;
use HTML_Elem;
use MimeTypes;
use FileOperator;

our $BASE_DIR_CONF;
our $BOX_WIDTH;
our $BOX_HEIGHT;
our $BOX_SPACE;
our $MAX_DISPLAY_NAME;
our ($EDIT_CGI, $CONVERTER_CGI, $MUSIC_PLAYER_CGI, $GPS_VIEWER_CGI);
our ($TEXT_VIEWER_CGI, $PICTURE_VIEWER_CGI, $GET_THUMBNAIL_CGI, $GETFILE_CGI);
our ($ICON_VIDEO, $ICON_PICTURE, $ICON_AUDIO, $ICON_TEXT, $ICON_PDF, $ICON_MAP);
our ($ICON_MS_WORD, $ICON_MS_EXCEL, $ICON_MS_POWERPOINT);
our ($ICON_UNKNOWN, $ICON_DIRECTORY);
require '%conf_dir%/stocker.conf';

my $form = eval{new CGI};
my $in_dir    = (scalar $form->param('dir'));
my $in_file   = (scalar $form->param('file'));
my $in_search = decode('utf-8', (scalar $form->param('search')));
my $in_from   = (scalar $form->param('from'));
my $in_to     = (scalar $form->param('to'));

my $script = $ENV{'SCRIPT_NAME'};
my $path = $in_file ? decode('utf-8', ParamPath->urlpath_decode($in_file)) : "/";

#### ディレクトリ一覧 ####

eval {
  my @jslist = (
      "%htdocs_root%/ajax_html_request.js",
      "%htdocs_root%/stocker_list.js",
      "%htdocs_root%/get_directory_list.js",
  );
  my @csslist = (
      "%htdocs_root%/stocker_list.css",
  );
  my $html = HTML_Elem->new(
      javascript => \@jslist,
      css => \@csslist
  );
  $html->header();
};
if ($@) {
  HTML_Elem->header();
  HTML_Elem->error($@);
}

my $encoded_dir = HTML_Elem->url_encode($in_dir);

#my $disp_box_x = int(${in_s_width} / (int($BOX_WIDTH) + int($BOX_SPACE)));    # 横に表示出来る数
#my $disp_box_y = int(${in_s_height} / (int($BOX_HEIGHT) + int($BOX_SPACE)));  # 縦に表示出来る数

#my $boxes = $disp_box_x * $disp_box_y * 3;  # 3スクロール分
my $boxes = 150;  # TODO:
if ($in_to eq '') { $in_to = $boxes; }

print "<form action=\"${script}\" name=\"file_check\" method=\"POST\">\n";
print "<input type=\"hidden\" name=\"mode\" value=\"\">\n";
print "<input type=\"hidden\" name=\"dir\" value=\"${encoded_dir}\">\n";
print "<div id=\"editParam\"></div>\n";
print "ディレクトリ: ";
print "<select name=\"fm_dir\" size=\"1\" onChange=\"changeDirectory()\">\n";

eval {
  my $ins = ParamPath->new(base_dir_conf => $BASE_DIR_CONF);
  $ins->init_by_base_name(HTML_Elem->url_decode(scalar($form->param('dir'))));
  for (my $i=0; $i<$ins->base_dirs_count(); $i++) {
    my $lst = $ins->get_base_dir_column($i);
    my $name = @{$lst}[0];
    my $encoded_name = HTML_Elem->url_encode($name);
    if ($encoded_dir eq $encoded_name) {
      print "<option value=\"${encoded_name}\" selected>".${name}."</option>\n";
    } else {
      print "<option value=\"${encoded_name}\">".${name}."</option>\n";
    }
  }
};
print "</select>\n";

if(0) {  # TODO: implement with JavaScript
  print <<EOD;
<script type="text/javascript">
<!--
var path = "${path}";
var inum = "${in_file}";
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
  document.write("/ <a href=\\\"$script?in=" + paInum + "&dir=${encoded_dir}\\\">" + pathArray[i] + "</a>&nbsp;");
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

print "<div id=\"uppath\"></div>\n";

my @dir_list = ();
#while (my $entry = decode('utf-8', readdir $DIR)) {
#  if( length($entry) > 0 && $entry ne '..'  && $entry !~ /^\./ && $entry ne 'lost+found') {
#    # 絞込みが指定された場合、マッチしない物はリストに入れない
#    if( ${in_search} && $entry !~ /${in_search}/i ) {
#      next;
#    }
#    push(@dir_list, $entry);
#  }
#}
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
print <<EOD;
<p id="directoryListArea"></p>
<script type="text/javascript">
<!--
var boxes = ${boxes};
var encoded_dir = document.file_check.fm_dir.value;

getDirectoryList(encoded_dir, "${in_file}", ${cont_from}, ${cont_to}, directoryList);

function directoryList(data) {
  // 拡張子判定
  var movie_pattern = /\\.(avi|flv|mov|mpg|mpeg|mpe|m2p|ts|mts|m2ts|mp4|m4v|mpg4|asf|wmv)\$/;
  var music_pattern = /\\.(mp3|wma|wav|flac)\$/;
  var photo_pattern = /\\.(jpg|jpeg)\$/;
  var gps_pattern = /\\.(kml|kmz|gpx|nmea)\$/;
  var txt_pattern = /\\.(txt|log)\$/;
  var doc_pattern = /\\.(doc|dot|docx)\$/;
  var excel_pattern = /\\.(xls|xlsx)\$/;
  var ppt_pattern = /\\.(ppt|pptx)\$/;
  var pdf_pattern = /\\.(pdf)\$/;

//  try {
    encoded_dir = document.file_check.fm_dir.value;

    const properties_elem = data.getElementsByTagName('properties');
    if (properties_elem == null) {
      alert("ERROR: properties tag is not found");
      return;
    }

    // titleをディレクトリ名にする
    const title_elem = properties_elem.item(0).getElementsByTagName('name');
    if (title_elem != null) {
      if (title_elem.item(0).firstChild) {
        document.title = title_elem.item(0).firstChild.data;
      } else {
        document.title = "";
      }
    }

    // 上位パスのリンク
    const uppath_elem = properties_elem.item(0).getElementsByTagName('up_path');
    if (uppath_elem != null) {
      if (uppath_elem.item(0).firstChild) {
        document.getElementById('uppath').innerHTML = "<a href=\\"javascript:getDirectoryList('" + encoded_dir + "', '" + uppath_elem.item(0).firstChild.data + "', 0, " + boxes + ", directoryList)\\">↑UP</a>";
      } else {
        document.getElementById('uppath').innerHTML = "";
      }
    }

    const contents_elem = data.getElementsByTagName('contents');
    if (contents_elem == null) {
      alert("ERROR: files list is NULL");
      return;
    }

    const elements = contents_elem.item(0).getElementsByTagName('element');
    if (elements == null) {
      alert("ERROR: files list has no elements");
      return;
    }

    document.getElementById('directoryListArea').innerHTML = "";

    for (var i=0; i<elements.length; i++) {
      var name_elem = elements.item(i).getElementsByTagName('name');
      var path_elem = elements.item(i).getElementsByTagName('path');
      var type_elem = elements.item(i).getElementsByTagName('type');
      var size_elem = elements.item(i).getElementsByTagName('size');
      var last_modified_elem = elements.item(i).getElementsByTagName('last_modified');

      if (name_elem != null && path_elem != null && type_elem != null && size_elem != null && last_modified_elem != null) {
        var icon;
        var action;

        var name = name_elem.item(0).firstChild.data;
        var path = path_elem.item(0).firstChild.data;
        var type = type_elem.item(0).firstChild.data;
        var size = size_elem.item(0).firstChild.data;
        var last_modified = last_modified_elem.item(0).firstChild.data;

        if (type === "DIRECTORY") {
            icon   = "${ICON_DIRECTORY}";
            action = "dir:" + path;
        } else {
          if (music_pattern.test(name.toLowerCase())) {
            icon   = "${ICON_AUDIO}";
            action = "${MUSIC_PLAYER_CGI}?file=" + path + "&dir=" + encoded_dir;
          } else if (movie_pattern.test(name.toLowerCase())) {
            icon   = "${GET_THUMBNAIL_CGI}?file=" + path + "&dir=" + encoded_dir;
            action = "${CONVERTER_CGI}?file=" + path + "&dir=" + encoded_dir;
          } else if (photo_pattern.test(name.toLowerCase())) {
            icon   = "${GET_THUMBNAIL_CGI}?file=" + path + "&dir=" + encoded_dir;
            action = "${PICTURE_VIEWER_CGI}?file=" + path + "&dir=" + encoded_dir;
          } else if (gps_pattern.test(name.toLowerCase())) {
            icon   = "${ICON_MAP}";
            action = "${GPS_VIEWER_CGI}?file=" + path + "&dir=" + encoded_dir;
          } else if (txt_pattern.test(name.toLowerCase())) {
            icon   = "${ICON_TEXT}";
            action = "${TEXT_VIEWER_CGI}?file=" + path + "&dir=" + encoded_dir;
          } else if (doc_pattern.test(name.toLowerCase())) {
            icon   = "${ICON_MS_WORD}";
            action = "${GETFILE_CGI}?file=" + path + "&dir=" + encoded_dir + "&mime=application/msword";
          } else if (excel_pattern.test(name.toLowerCase())) {
            icon   = "${ICON_MS_EXCEL}";
            action = "${GETFILE_CGI}?file=" + path + "&dir=" + encoded_dir + "&mime=application/vnd.ms-excel";
          } else if (ppt_pattern.test(name.toLowerCase())) {
            icon   = "${ICON_MS_POWERPOINT}";
            action = "${GETFILE_CGI}?file=" + path + "&dir=" + encoded_dir + "&mime=application/vnd.ms-powerpoint";
          } else if (pdf_pattern.test(name.toLowerCase())) {
            icon   = "${ICON_PDF}";
            action = "${GETFILE_CGI}?file=" + path + "&dir=" + encoded_dir + "&mime=application/pdf";
	  } else {
            icon   = "${ICON_UNKNOWN}";
            action = "${GETFILE_CGI}?file=" + path + "&dir=" + encoded_dir + "&mime=application/octet-stream";
          }
        }
        printIcon(${BOX_WIDTH}, ${BOX_HEIGHT}, path, name, size, last_modified, icon, action);
      }
    }
//  } catch(e) {
//     alert("ERROR: " + e.description);
//  }
}
-->
</script>
EOD

print "<p class=\"partition\">&nbsp;</p>\n";

if($#dir_list > $cont_to - $cont_from || $#dir_list < $cont_from) {
  &show_next_pagelink(@dir_list);
  print "<br><br>\n";  # ページ下の余白
}

my @checked_list; # = ParamPath->get_checked_list(\$form, "${base}${path}");

print "</form>\n";
print "<script type=\"text/javascript\">\n";
print "<!--\n";
#foreach my $checked (@checked_list) {
#  my $checked_in = (stat("${base}${path}/${checked}"))[1];
#  if (&contain($checked_in, \@visible_list)) {
#    print "  document.getElementsByName('" . $checked_in . "')[0].checked = true;\n";  # checkbox
#  } elsif (&contain($checked_in, \@un_visible_list)) {
#    print "  document.getElementsByName('" . $checked_in . "')[0].value = 1;\n";  # hidden属性
#  }
#}
print "var visible_list = [";
for (my $i=0; $i<@visible_list; $i++) {
  if ($i != 0) {
      #  print ", ";
  }
  #  print "\"". $visible_list[$i]. "\"";
}
print "];\n";
print "var un_visible_list = [";
for (my $i=0; $i<@un_visible_list; $i++) {
  if ($i != 0) {
    print ", ";
  }
  print "\"". $un_visible_list[$i]. "\"";
}
print "];\n";
print "-->\n";
print "</script>\n";

#&print_disk_space("$base");
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
  print "<select name=\"boxval\" onChange=\"jump_select(${boxes})\">\n";
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
      allCheck();
      break;
    case "allUnCheck":
      allUnCheck();
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
      elem.innerHTML = '<input type="hidden" name="f_dest" value="${in_file}">'
                     + '<input type="hidden" name="f_dest_dir" value="${encoded_dir}">';
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

sub getMimeType
{
  my ($path) = @_;

  $path =~ /[^\/]+\.(.+)$/;
  my $extention = $1;

  return MimeTypes->content_type($extention);
}

