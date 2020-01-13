#!/usr/bin/perl

# ファイルの削除、アップロード、リネームなどのファイル管理の機能

use strict;
#use warning;

use utf8;
use Encode;

use CGI;
use File::Copy;  # for file move across the different filesystems
use File::Path;
use File::Basename;

use ParamPath;
use HTML_Elem;
use FileOperator;

our $BASE_DIR_CONF;
our $STOCKER_CGI;
our $TRASH_PATH;
our $TRASH_IGNORE_PATTERN;
our $TRASH_IGNORE_SIZE;
require $ENV{'STOCKER_CONF'} . '/stocker.conf';

my $form = eval{new CGI};
my $mode = scalar($form->param('mode'));
my @files = $form->multi_param('file');
my $base_name = HTML_Elem->url_decode(scalar($form->param('dir')));
my $encoded_dir = HTML_Elem->url_encode(encode('utf-8', $base_name));

my $target = scalar($form->param('target'));
my $back_link = "${STOCKER_CGI}?file=" . $target . "&dir=" . $encoded_dir;

my $base;
eval {
  my $ins = ParamPath->new(base_dir_conf => $BASE_DIR_CONF);
  $ins->init_by_base_name(${base_name});
  $base = $ins->{base};
};
if ($@) {
  error($@);
}

if( ${mode} eq "do_delete" ) {
  &do_delete();
} elsif( ${mode} eq "do_newfolder" ) {
  &do_newfolder();
} elsif( ${mode} eq "upload" ) {
  &form_upload();
} elsif( ${mode} eq "do_upload" ) {
  &do_upload();
} elsif( ${mode} eq "do_rename" ) {
  &do_rename();
} elsif( ${mode} eq "do_move" ) {
  &do_move();
} else {
  &error("実装されていない機能です");
}

exit(0);

sub success() {
  print "Content-Type: text/json\n\n";
  print "{\"status\": \"ok\", \"message\": \"successful\"}\n";
}

sub error() {
  my ($message) = @_;

  $message =~ s/[\r\n]//g;
  my $output_message = encode('utf-8', $message);

  print "Content-Type: text/json\n\n";
  print "{\"status\": \"fail\", \"message\": \"${output_message}\"}\n";
  exit(0);
}

########################
### 新規フォルダ作成 ###
########################
sub do_newfolder() {
  my $newname = decode('utf-8', scalar($form->param('newname')));
  my $path = decode('utf-8', ParamPath->urlpath_decode(scalar($form->param('file'))));

  # ファイル名チェック
  if (! FileOperator->isFilename("$newname")) {
    &error("指定された名前は使用できません。別の名前に変更してください");
  }

  my $newfolder = encode('utf-8', "${base}${path}/" . $newname);

  # 重複チェック
  if( -e "${newfolder}") {
    &error("指定された名前(".$newname.")は既に使われています。別の名前を指定してください");
  }

  if(! mkdir("${newfolder}")) {
    my $reason = $!;
    &error("ディレクトリ作成に失敗しました(${path} - $reason)");
  }

  &success();
}

##############################
### ファイルのアップロード ###
##############################
sub form_upload() {
  my $path = decode('utf-8', ParamPath->urlpath_decode($target));

  my $html = <<EOF;
<h1>ファイルのアップロード</h1>
作成先: $path<br>
<form action="$ENV{'SCRIPT_NAME'}" name="f1" method="POST" onSubmit="return confirm_act('アップロード')" enctype="multipart/form-data">
ファイル1: <input type="file" name="file1"><br>
ファイル2: <input type="file" name="file2"><br>
ファイル3: <input type="file" name="file3"><br>
ファイル4: <input type="file" name="file4"><br>
ファイル5: <input type="file" name="file5"><br>

<input type="hidden" name="mode" value="do_upload">
<input type="hidden" name="target" value="${target}">
<input type="hidden" name="dir" value="${encoded_dir}">

<br>
<input type="submit" name="b_submit" value="実行">
<input type="button" name="b_cancel" value="キャンセル" onClick="jump('${back_link}')">
</form>
EOF
  print encode('utf-8', $html);

  HTML_Elem->tail();
}

sub do_upload() {
  eval {
    &save_upfile('file1');
    &save_upfile('file2');
    &save_upfile('file3');
    &save_upfile('file4');
    &save_upfile('file5');
    &success();
  };
  if ($@) {
    &error("アップロードに失敗しました - $@");
  }
}

sub save_upfile
{
  my ($formname) = @_;
  my $path = decode('utf-8', ParamPath->urlpath_decode($target));

  if ($form->param($formname)) {
    my $fname = basename(decode('utf-8', scalar($form->param($formname))));
    if ($fname && FileOperator->isFilename($fname)) {
      my $fh = $form->upload($formname);
      my $newfile = encode('utf-8', "${base}${path}/" . $fname);
      if (-e "${newfile}") {
        die "[" . HTML_Elem->escape_html($fname) . "]は既に存在します";
      } else {
        copy ($fh, "${newfile}");
      }
    } else {
      die "[" . HTML_Elem->escape_html($fname) . "]は不正なファイル名です";
    }
  }
}

################
### 名前変更 ###
################
sub do_rename() {
  my $file = decode('utf-8', ParamPath->urlpath_decode($files[0]));
  my $orig_dir  = ${base} . "/" . ParamPath->get_up_path($file);
  my $orig_path = encode('utf-8', ${base} . "/" . $file);

  my $dest_name = decode('utf-8', scalar($form->param('newname')));
  my $dest_path = encode('utf-8', "${orig_dir}/${dest_name}");

  # ファイル名チェック
  if (! FileOperator->isFilename($dest_name)) {
    &error("指定された名前は使用できません。別の名前に変更してください");
  }

  # 既存ファイル名重複チェック
  if (-e "${dest_path}") {
    &error("指定された名前(".$dest_name.")は既に使われています。別の名前を指定してください");
  }

  if(! rename("${orig_path}", "${dest_path}")) {
    &error("${dest_name} の名前変更に失敗しました($!)");
  }

  &success();
}

#############
### 移 動 ###
#############
sub do_move() {
  my $dest_path = decode('utf-8', ParamPath->urlpath_decode(scalar($form->param('dest_path'))));  # 移動先のパス
  my $dest_root = HTML_Elem->url_decode(scalar($form->param('dest_root')));  # 移動先のディレクトリ(base)

  if (@files.length == 0) {
    &error("チェックが一つも選択されていません");
  }

  my $move_dest = "";
  eval {
    my $ins = ParamPath->new(base_dir_conf => $BASE_DIR_CONF);
    $ins->init_by_base_name(${dest_root});
    $move_dest = $ins->{base} . $dest_path;
  };
  if ($@) {
    &error("不正なパスが指定されました");
  }

  foreach my $file (@files) {
    my $entry = decode('utf-8', ParamPath->urlpath_decode($file));
    my $origin_path = encode('utf-8', "${base}${entry}");
    my $filename = ParamPath->get_filename($entry);

    if(${entry} =~ /\/\./) {
      &error("移動先に移動できないパスが指定されています");
    }
    if( -e "${move_dest}/${filename}") {
      &error("既に同じ名前が存在するため移動できません($filename)");
    }
    if(! move("${origin_path}", encode('utf-8', "${move_dest}"))) {
      my $reason = $!;
      &error("移動に失敗しました($reason)");
    }
  }

  &success();
}

#############
### 削 除 ###
#############
sub do_delete() {
  if (@files.length == 0) {
    &error("チェックが一つも選択されていません");
  }

  foreach my $file (@files) {
    eval {
      my $entry = decode('utf-8', ParamPath->urlpath_decode($file));
      &delete_work($entry);
    };
    if ($@) {
      &error("削除に失敗しました($@)。");
    }
  }

  &success();
}

sub judgeMoveTrash {
  my ($path) = @_;
  my $decoded_path = decode('utf-8', $path);
  my $filesize = -s "${path}";

  if (${TRASH_IGNORE_SIZE} && ${TRASH_IGNORE_SIZE} > 0 && ${filesize} > $TRASH_IGNORE_SIZE) {
    return 0;
  }

  if ($decoded_path =~ /^${TRASH_PATH}/) {
    return 0;
  }

  if (${TRASH_IGNORE_PATTERN} && length(${TRASH_IGNORE_PATTERN}) > 0) {
    if ($decoded_path =~ /${TRASH_IGNORE_PATTERN}/) {
      return 0;
    }
  }

  return 1;
}

sub delete_work {
  my ($entry) = @_;
  my $delete_path = encode('utf-8', "${base}${entry}");

  if (-f "${delete_path}") {
    if (judgeMoveTrash("${delete_path}") == 1) {
      # trash に移動する
      my $entry_dir = ParamPath->get_up_path($entry);
      my $save_path = encode('utf-8', ${TRASH_PATH} . "/" . ${base_name} . "/" . ${entry_dir});
      if(! -d "$save_path") {
        eval {
          mkpath("$save_path");
        };
        if ($@) {
          die "待避先の書込み権限がないため、削除を中止しました - $@";
        }
      }

      if(! move("${delete_path}", "$save_path")) {
        die $!;
      }
    } else {
      # trash に移動しないで直接削除する
      eval {
        unlink("${delete_path}");
      };
      if ($@) {
        die "$@";
      }
    }
  } elsif (-d "${delete_path}") {
    opendir(my $dh, $delete_path) || die "Can't opendir ${delete_path}: $!";
    while (readdir $dh) {
      next if /^\.{1,2}$/;  # '.'と'..'をスキップ
      &delete_work($entry . "/" . decode('utf-8', $_));
    }
    closedir $dh;

    if (! rmdir("${delete_path}")) {
      die $!;
    }
  } else {
    die "存在しないパスが指定されました";
  }
}

1;
__END__
