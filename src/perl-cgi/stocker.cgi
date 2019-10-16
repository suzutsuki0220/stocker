#!/usr/bin/perl

use strict;
use warnings;
use utf8;
use CGI;
use Encode;

use ParamPath;
use HTML_Elem;
use MimeTypes;
use FileOperator;

our $BASE_DIR_CONF;
our $HTDOCS_ROOT;
our ($EDIT_CGI, $FILEFUNC_CGI, $CONVERTER_CGI, $GPS_VIEWER_CGI);
our ($GET_THUMBNAIL_CGI, $GETFILE_CGI);
require $ENV{'STOCKER_CONF'} . '/stocker.conf';

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
      "${HTDOCS_ROOT}/bundle/stocker.js",
      "${HTDOCS_ROOT}/javascript/stocker_list.js",
      "${HTDOCS_ROOT}/javascript/get_directory_list.js",
      "${HTDOCS_ROOT}/javascript/action.js",
  );
  my @csslist = (
      "${HTDOCS_ROOT}/stylesheet/stocker_list.css",
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

#my $boxes = $disp_box_x * $disp_box_y * 3;  # 3スクロール分
my $boxes = 500;  # TODO:

print "<form action=\"${script}\" name=\"file_check\" method=\"POST\">\n";
print "<input type=\"hidden\" name=\"mode\" value=\"\">\n";
print "<input type=\"hidden\" name=\"target\" value=\"${in_file}\">\n";
print "<input type=\"hidden\" name=\"dir\" value=\"${encoded_dir}\">\n";
print "<div id=\"editParam\"></div>\n";
print "ディレクトリ: ";
print "<select name=\"fm_dir\" size=\"1\" onChange=\"changeDirectory()\">\n";

eval {
  my $ins = ParamPath->new(base_dir_conf => $BASE_DIR_CONF);
  $ins->init_by_base_name(HTML_Elem->url_decode(scalar($form->param('dir'))));
  for (my $i=0; $i<$ins->base_dirs_count(); $i++) {
    my $lst = $ins->get_base_dir_column($i);
    my $name = $lst->{name};
    my $encoded_name = HTML_Elem->url_encode($name);
    if ($encoded_dir eq $encoded_name) {
      print "<option value=\"${encoded_name}\" selected>".${name}."</option>\n";
    } else {
      print "<option value=\"${encoded_name}\">".${name}."</option>\n";
    }
  }
};
print "</select>\n";
print "<span id=\"path_link\"></span>\n";

print "<div style=\"clear: both\">";
print "<span style=\"float: left\">\n";
print "<input type=\"text\" name=\"search\" size=\"20\" maxlength=\"64\" value=\"${in_search}\">\n";
print "<input type=\"submit\" value=\"表示絞込み\"></span>\n";
print "<span id=\"action_list\" style=\"float: right\"></span></div>\n";
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
my $cont_from = 0;

my $cont_to = $#dir_list;
if(length(${in_to}) > 0 && ${in_to} > 0) {
  $cont_to = $in_to -1;
}

### ディレクトリ内のentry表示
print <<EOD;
<p id="directoryListArea"></p>
<script type="text/javascript">
<!--
var boxes = ${boxes};
var encoded_dir = document.file_check.fm_dir.value;

makeActionList();
reloadDirectoryList(encoded_dir, "${in_file}", ${cont_from}, ${cont_to});

function printIcons(elements) {
//  try {
    document.getElementById('directoryListArea').innerHTML = "";

    clearTrimWork();
    for (var i=0; i<elements.length; i++) {
        const e = elements[i];

        var icon;
        var action;

        const name = e.name;
        const path = e.path;

        if (e.type === "DIRECTORY") {
            icon   = stocker.uri.icon.directory;
            action = "dir:" + path;
        } else {
          if (stocker.supportTypes.pattern.audio.test(name)) {
            icon   = stocker.uri.icon.audio;
            action = "${HTDOCS_ROOT}/music_player.html?file=" + path + "&dir=" + encoded_dir;
          } else if (stocker.supportTypes.pattern.video.test(name)) {
            icon   = "${GET_THUMBNAIL_CGI}?file=" + path + "&dir=" + encoded_dir;
            action = "${CONVERTER_CGI}?file=" + path + "&dir=" + encoded_dir;
          } else if (stocker.supportTypes.pattern.image.test(name)) {
            icon   = "${GET_THUMBNAIL_CGI}?file=" + path + "&dir=" + encoded_dir;
            action = "${HTDOCS_ROOT}/picture_viewer.html?file=" + path + "&dir=" + encoded_dir;
          } else if (stocker.supportTypes.pattern.gps.test(name)) {
            icon   = stocker.uri.icon.gps;
            action = "${GPS_VIEWER_CGI}?file=" + path + "&dir=" + encoded_dir;
          } else if (stocker.supportTypes.pattern.txt.test(name)) {
            icon   = stocker.uri.icon.txt;
            action = "${HTDOCS_ROOT}/text_viewer.html?file=" + path + "&dir=" + encoded_dir;
          } else if (stocker.supportTypes.pattern.doc.test(name)) {
            icon   = stocker.uri.icon.doc;
            action = "${GETFILE_CGI}?file=" + path + "&dir=" + encoded_dir + "&mime=application/msword";
          } else if (stocker.supportTypes.pattern.excel.test(name)) {
            icon   = stocker.uri.icon.excel;
            action = "${GETFILE_CGI}?file=" + path + "&dir=" + encoded_dir + "&mime=application/vnd.ms-excel";
          } else if (stocker.supportTypes.pattern.ppt.test(name)) {
            icon   = stocker.uri.icon.ppt;
            action = "${GETFILE_CGI}?file=" + path + "&dir=" + encoded_dir + "&mime=application/vnd.ms-powerpoint";
          } else if (stocker.supportTypes.pattern.pdf.test(name)) {
            icon   = stocker.uri.icon.pdf;
            action = "${GETFILE_CGI}?file=" + path + "&dir=" + encoded_dir + "&mime=application/pdf";
          } else {
            icon   = stocker.uri.icon.unknown;
            action = "${GETFILE_CGI}?file=" + path + "&dir=" + encoded_dir + "&mime=application/octet-stream";
          }
        }
        printIcon(i, path, name, e.size, e.last_modified, icon, action);
    }
    doTrimWork();
//  } catch(e) {
//     alert("ERROR: " + e.description);
//  }
}
-->
</script>
EOD

print "<p class=\"partition\">&nbsp;</p>\n";
print "</form>\n";

HTML_Elem->tail();
exit(0);

######

## 操作  TODO: remove
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
  document.file_check.dir.value = document.file_check.fm_dir.value;
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
      document.file_check.action = "${FILEFUNC_CGI}";
      document.file_check.submit();
      break;
    case "upload":
      document.file_check.mode.value = "upload";
      document.file_check.action = "${FILEFUNC_CGI}";
      document.file_check.submit();
      break;
    case "download":
      downloadWork(encoded_dir);
      break;
    case "delfile":
      document.file_check.mode.value = "delfile";
      document.file_check.action = "${FILEFUNC_CGI}";
      document.file_check.submit();
      break;
    case "rename":
      document.file_check.mode.value = "rename";
      document.file_check.action = "${FILEFUNC_CGI}";
      document.file_check.submit();
      break;
    case "move":
      var elem = document.createElement("f_dest");
      elem.innerHTML = '<input type="hidden" name="f_dest" value="${in_file}">'
                     + '<input type="hidden" name="f_dest_dir" value=\"" + encoded_dir + "\">';
      document.getElementById("editParam").appendChild(elem);
      document.file_check.mode.value = "move";
      document.file_check.action = "${FILEFUNC_CGI}";
      document.file_check.submit();
      break;
  }
}
-->
</script>
EOF
}

sub getMimeType
{
  my ($path) = @_;

  $path =~ /[^\/]+\.(.+)$/;
  my $extention = $1;

  return MimeTypes->content_type($extention);
}
