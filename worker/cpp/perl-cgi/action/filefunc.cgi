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

our $BASE_DIR_CONF;
our $TRASH_PATH;
our $TRASH_IGNORE_PATTERN;
our $TRASH_IGNORE_SIZE;
require $ENV{'STOCKER_CONF'} . '/stocker.conf';

my $form = eval{new CGI};
my $mode = scalar($form->param('mode'));
my @files = $form->multi_param('file');
my $base_name = HTML_Elem->url_decode(scalar($form->param('dir')));

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

sub isFilename {
  my ($name) = @_;

  if (! $name || length($name) > 247) {  # Limitation of Windows Explorer
    return undef;
  }
  if ($name =~ /[\\\/:\?<>|\"\*]/) {
    return undef;
  }

  return 1;
}

########################
### 新規フォルダ作成 ###
########################
sub do_newfolder() {
  my $newname = decode('utf-8', scalar($form->param('newname')));
  my $path = decode('utf-8', ParamPath->urlpath_decode(scalar($form->param('file'))));

  # ファイル名チェック
  if (! &isFilename("$newname")) {
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
sub do_upload() {
  my $formname = "file";

  if (! $form->param($formname)) {
    &error("ファイルデータがありません");
  }

  my $path = decode('utf-8', ParamPath->urlpath_decode(scalar($form->param('file'))));
  my $new_name = basename(decode('utf-8', scalar($form->param($formname))));

  if (! &isFilename($new_name)) {
    &error("[" . HTML_Elem->escape_html($new_name) . "]は不正なファイル名です");
  }

  my $fh = $form->upload($formname);
  my $new_path = encode('utf-8', "${base}${path}/" . $new_name);
  if (-e "${new_path}") {
    &error("[" . HTML_Elem->escape_html($new_name) . "]は既に存在します");
  } else {
    copy ($fh, "${new_path}");
  }

  &success();
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
  if (! &isFilename($dest_name)) {
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
