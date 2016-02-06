## media_edit.cgi 機能
# ファイルの削除、アップロード、リネームなどのファイル管理の機能

use File::Copy;  # for file move across the different filesystems
use File::Path;
use File::Basename;
use Archive::Zip qw (:ERROR_CODES);  # download one more files at once


########################
### 新規フォルダ作成 ###
########################
sub form_newfolder() {
  &header();

  print <<EOD;
<script type="text/javascript">
<!--
  function backPage() {
    location.href = "media.cgi?in=${in}&dir=${dir}";
  }
-->
</script>
EOD

  print <<EOF;
<h1>新規フォルダーの作成</h1>
<form action="$ENV{'SCRIPT_NAME'}" name="f1" method="POST">
<input type="hidden" name="mode" value="do_newfolder">
<input type="hidden" name="in" value="${in}">
<input type="hidden" name="dir" value="${dir}">
<p>
フォルダー名: <input type="text" name="foldername" value=""><br>
<br>
<input type="submit" value="実行">
<input type="button" value="キャンセル" onClick="backPage()">
</p>
</form>
EOF

  &tail();
}

sub do_newfolder() {
  my $newname = $q->param('foldername');

  # ファイル名チェック
  if (! &isFilenameValid("$newname")) {
    &header();
    &error("指定された名前は使用できません。別の名前に変更してください");
    exit(1);
  }

  # 既存ファイル名重複チェック
  if( -e "$path/".$newname) {
    &header();
    &error("指定された名前(".$newname.")は既に使われています。別の名前を指定してください");
    exit(1);
  }

  if(! mkdir("$path/".$newname)) {
      my $reason = $!;
      &header();
      &error("ディレクトリ作成に失敗しました($reason)");
      exit(1);
  }

  &redirect_to_mediacgi("完了", "新しいフォルダを作成しました");
}

##############################
### ファイルのアップロード ###
##############################
sub form_upload() {
  &header();

  print <<EOD;
<script type="text/javascript">
<!--
  function backPage() {
    location.href = "media.cgi?in=${in}&dir=${dir}";
  }
-->
</script>
EOD

  print "<h1>ファイルのアップロード</h1>\n";

  print "<form action=\"$ENV{'SCRIPT_NAME'}\" name=\"f1\" method=\"POST\" enctype=\"multipart/form-data\">\n";
  print "ファイル1: <input type=\"file\" name=\"file1\"><br>\n";
  print "ファイル2: <input type=\"file\" name=\"file2\"><br>\n";
  print "ファイル3: <input type=\"file\" name=\"file3\"><br>\n";
  print "ファイル4: <input type=\"file\" name=\"file4\"><br>\n";
  print "ファイル5: <input type=\"file\" name=\"file5\"><br>\n";

  print "<input type=\"hidden\" name=\"mode\" value=\"do_upload\">\n";
  print "<input type=\"hidden\" name=\"in\" value=\"${in}\">\n";
  print "<input type=\"hidden\" name=\"dir\" value=\"${dir}\">\n";

  print "<br>\n";
  print "<input type=\"submit\" value=\"実行\">\n";
  print "<input type=\"button\" value=\"キャンセル\" onClick=\"backPage()\">";
  print "</form>\n";

  &tail();
}

sub do_upload() {
  &save_upfile('file1');
  &save_upfile('file2');
  &save_upfile('file3');
  &save_upfile('file4');
  &save_upfile('file5');

  &redirect_to_mediacgi("アップロード完了", "アップロードが完了しました");
}

sub save_upfile
{
  my ($formname) = @_;

  if ($q->param($formname)) {
    my $fname = basename($q->param($formname));
    if ($fname && length($fname) > 0) {
      my $fh = $q->upload($formname);
      copy ($fh, "$path/$fname");
      undef $fname;
    }
  }
}

####################
### ダウンロード ###
####################
sub do_download() {
  my @files = &get_checked_list($path);
  if (@files.length == 0) {
    &header();
    &error("チェックが一つも選択されていません");
    &tail();
    return;
  }

  if (@files.length == 1) {
    my $file = $path."/".$files[0];
    # 一つの時はそのまま出力
    &output_filedata($file, $files[0]);
  } else {
    # 複数の時はzipに固めて出力
    my $zip = Archive::Zip->new();
    foreach $entry (@files) {
# TODO: 文字コード変換 -> to cp932
      if (-f "$path/$entry") {
        # ファイルの時
        $zip->addFile("$path/$entry", $entry);
      } elsif (-d "$path/$entry") {
        # ディレクトリの時
        $zip->addTree("$path/$entry", $entry);
      }
    }

    my $ret;
    if (($ret = $zip->writeToFileNamed($TMP_FILE)) == AZ_OK) {
      &output_filedata($TMP_FILE, "download[".$files[0]."].zip");
      unlink($TMP_FILE);
    } else {
      &header();
      if ($ret == AZ_STREAM_END) {
        $reason = "The read stream (or central directory) ended normally.";
      } elsif ($ret == AZ_ERROR) {
        $reason = "There was some generic kind of error.";
      } elsif ($ret == AZ_FORMAT_ERROR) {
        $reason = "There is a format error in a ZIP file being read.";
      } elsif ($ret == AZ_IO_ERROR) {
        $reason = "There was an IO error.";
      } else {
        $reason = "Unknown error";
      }

      &error("圧縮に失敗しました: ${reason}");
      &tail();
    }
  }

  return;
}

sub output_filedata()
{
  my ($fullpath, $name) = @_;
  print "Content-Type: application/octet-stream; charset=utf8\n";
#TODO: ファイル名をブラウザごとの処理で日本語エンコードする
## http://d.hatena.ne.jp/maachang/20110730/1312008966
  print "Content-Disposition: attachment; filename=${name}\n";
  print "Content-Length: ". (-s $fullpath) ."\n";
  print "\n";
  open(MEDIA, $fullpath) or die("media file open error");
  binmode MEDIA;
  while(<MEDIA>) {
    print $_;
  }
  close MEDIA;
}

################
### 名前変更 ###
################
sub form_rename() {
  &header();

  my @files = &get_checked_list($path);
  if (@files.length == 0) {
    &error("チェックが一つも選択されていません");
    &tail();
    return;
  }
  @files = sort {$a cmp $b} @files;

  print <<EOD;
<script type="text/javascript">
<!--
  function confirm_delete() {
    if (confirm("名前の変更を行います。よろしいですか？")) {
      return true;
    } else {
      return false;
    }
  }
  function backPage() {
    location.href = "media.cgi?in=${in}&dir=${dir}";
  }
-->
</script>
EOD

  print "<h1>名前の変更</h1>\n";
  print "<p>選択: ", @files.length, "ファイル</p>\n";

  print "<form action=\"$ENV{'SCRIPT_NAME'}\" name=\"f1\" method=\"POST\" onSubmit=\"return confirm_delete();\">\n";
  foreach $filename (@files) {
    print $filename . " → ";
    print "<input type=\"text\" name=\"${filename}\" value=\"${filename}\"><br>\n";
  }
  print "<br>\n";
  print "<input type=\"hidden\" name=\"mode\" value=\"do_rename\">\n";
  print "<input type=\"hidden\" name=\"in\" value=\"${in}\">\n";
  print "<input type=\"hidden\" name=\"dir\" value=\"${dir}\">\n";

  print "<br>\n";
  print "<input type=\"submit\" value=\"実行\">\n";
  print "<input type=\"button\" value=\"キャンセル\" onClick=\"backPage()\">";
  print "</form>\n";

  &tail();
}

sub do_rename() {
  my @files = ();
  opendir( DIR, "$path" ) or error( "ディレクトリのアクセスに失敗しました" );
  while( $entry = readdir DIR ) {
    if( length($entry) > 0 && $entry ne '..'  && $entry ne '.' && $q->param($entry)) {
      # ファイル名チェック
      if (! &isFilenameValid($q->param($entry))) {
        &header();
        &error("指定された名前は使用できません。別の名前に変更してください");
        exit(1);
      }
      # 既存ファイル名重複チェック
      if( -e "$path/".$q->param($entry)) {
        &header();
        &error("指定された名前(".$q->param($entry).")は既に使われています。別の名前を指定してください");
        exit(1);
      }
      # リスト内の重複チェック
      foreach $org_name (@files) {
        if ($q->param($org_name) eq $q->param($entry)) {
          &header();
          &error("名前($q->param($entry))は重複しています。別の名前を指定してください");
          exit(1);
        }
      }
      push(@files, $entry);
    }
  }
  close(DIR);

  foreach $entry (@files) {
    if(! rename("$path/$entry", "$path/".$q->param($entry))) {
      my $reason = $!;
      &header();
      &error("名前の変更に失敗しました($reason)");
      exit(1);
    }
  }

  &redirect_to_mediacgi("変更完了", "名前を変更しました");
}

#############
### 移 動 ###
#############
sub form_move() {
  &header();

  my $dest = $q->param('f_dest');
  my $dest_dir = $q->param('f_dest_dir');
  my $dest_base = @{$MEDIA_DIRS[0]}[2];
  my @lst_dest = ();

  my @files = &get_checked_list($path);
  if (@files.length == 0) {
    &error("チェックが一つも選択されていません");
    &tail();
    return;
  }

  print <<EOD;
<script type="text/javascript">
<!--
  function confirm_act() {
    if (confirm("移動します。よろしいですか？")) {
      return true;
    } else {
      return false;
    }
  }
  function backPage() {
    location.href = "media.cgi?in=${in}&dir=${dir}";
  }
  function refresh() {
    document.f1.mode.value = "move";
    document.f1.submit();
  }
-->
</script>
EOD

  print "<h1>移動</h1>\n";
  print "<p>選択: ", @files.length, "ファイル</p>\n";

  print "<form action=\"$ENV{'SCRIPT_NAME'}\" name=\"f1\" method=\"POST\" onSubmit=\"return confirm_act();\">\n";
  foreach $filename (@files) {
    my $inode = (stat("$path/$filename"))[1];
    print "<input type=\"hidden\" name=\"${inode}\" value=\"1\">\n";
    print $filename ."<br>\n";
  }
  print "<br>\n";
  print "<fieldset><legend>移動先</legend>\n";

#  if (length($dest_dir) == 0) {
#    $dest_dir = ${dir};
#  }
  print "ディレクトリ: ";
  print "<select name=\"f_dest_dir\" size=\"1\" onChange=\"refresh()\">\n";
  foreach my $lst (@MEDIA_DIRS) {
    if (${dest_dir} eq @{$lst}[1]) {
      print "<option value=\"". @{$lst}[1] ."\" selected>";
      $dest_base = @{$lst}[2];
    } else {
      print "<option value=\"". @{$lst}[1] ."\">";
    }
    print @{$lst}[0] ."</option>\n";
  }
  my $dest_path = &inode_to_fullpath(${dest_base}, ${dest});
  print "</select><br>\n";
  print "パス [".substr($dest_path, length($dest_base))."]<br>\n";
  print "<select name=\"f_dest\" size=\"10\" onChange=\"refresh()\">\n";
  opendir(DIR, $dest_path);
  while(my $entry = readdir DIR) {
    if (length($entry) > 0 && $entry !~ /^\./ && $entry ne 'lost+found') {
      if (-d "${dest_path}/${entry}") {
        push(@lst_dest, $entry);
      }
    }
  }
  closedir(DIR);

  if (length(${dest}) > 0) {
    $dest =~ /(.*?)\/([^\/]{1,})$/;
    my $dest_updir = $1;
    print "<option value=\"${dest_updir}\">..</option>\n";
  }
  @lst_dest = sort {$a cmp $b} @lst_dest;
  foreach my $entry (@lst_dest) {
    print "<option value=\"${dest}/".(stat "${dest_path}/${entry}")[1]."\">${entry}</option>\n";
  }
  print "</select></fieldset>\n";
  print <<EOF;
<br>
<input type="hidden" name="mode" value="do_move">
<input type="hidden" name="in" value="${in}">
<input type="hidden" name="dir" value="${dir}">
<input type="hidden" name="dest_dir" value="${dest_dir}">
<input type="hidden" name="dest" value="${dest}">

<br>
<input type="submit" value="実行">
<input type="button" value="キャンセル" onClick="backPage()">
</form>
EOF

  &tail();
}

sub do_move() {
  my @files = &get_checked_list($path);

  my $dest = $q->param('dest');
  my $dest_dir = $q->param('dest_dir');

  if (length($dest) == 0) {
    &header();
    &error("移動先のディレクトリが指定されていません");
    exit(1);
  }

  my $dest_base = "";
  foreach my $lst (@MEDIA_DIRS) {
    if(${dest_dir} eq @{$lst}[1]) {
      $dest_base = @{$lst}[2];
      last;
    }
  }
  if (length($dest_base) == 0) {
    &header();
    &error("不正なパスが指定されました");
    exit(1);
  }

  my $dest_path = &inode_to_fullpath($dest_base, ${dest});

  foreach $entry (@files) {
    if(${entry} =~ /\/\./) {
      &header();
      &error("移動先に移動できないパスが指定されています");
      exit(1);
    }
    if( -e "${dest_path}/${entry}") {
      &header();
      &error("既に同じ名前が存在するため移動できません($entry)");
      exit(1);
    }
    if(! move("$path/$entry", "${dest_path}")) {
      my $reason = $!;
      &header();
      &error("移動に失敗しました($reason)");
      exit(1);
    }
  }

  &redirect_to_mediacgi("完了", "移動しました");
}

#############
### 削 除 ###
#############
sub form_delete() {
  &header();

  my @files = &get_checked_list($path);
  if (@files.length == 0) {
    &error("チェックが一つも選択されていません");
    &tail();
    return;
  }

  print <<EOD;
<script type="text/javascript">
<!--
  function confirm_delete() {
    if (confirm("削除します。よろしいですか？")) {
      return true;
    } else {
      return false;
    }
  }
  function backPage() {
    location.href = "media.cgi?in=${in}&dir=${dir}";
  }
-->
</script>
EOD

  print "<h1>ファイルの削除</h1>\n";
  print "<p>選択: ", @files.length, "ファイル</p>\n";

  print "<form action=\"$ENV{'SCRIPT_NAME'}\" name=\"f1\" method=\"POST\" onSubmit=\"return confirm_delete();\">\n";
  foreach $filename (@files) {
    my $inode = (stat("$path/$filename"))[1];
    print "<input type=\"hidden\" name=\"${inode}\" value=\"1\">\n";
    print $filename ."<br>\n";
  }
  print "<br>\n";
  print "<input type=\"hidden\" name=\"mode\" value=\"do_delete\">\n";
  print "<input type=\"hidden\" name=\"in\" value=\"${in}\">\n";
  print "<input type=\"hidden\" name=\"dir\" value=\"${dir}\">\n";

  print "<br>\n";
  print "<input type=\"submit\" value=\"実行\">\n";
  print "<input type=\"button\" value=\"キャンセル\" onClick=\"backPage()\">";
  print "</form>\n";

  &tail();
}

sub do_delete() {
  my $inner_path = substr($path, length($base));

  if(! -d $TRASH_PATH.$inner_path) {
    if(! mkpath($TRASH_PATH.$inner_path)) {
      &header();
      &error("待避先の書込み権限がないため、削除を中止しました");
      exit(1);
    }
  }

  my @files = &get_checked_list($path);
  if (@files == 0) {
    &header();
    &error("チェックが一つも選択されていません");
    &tail();
    return;
  }

  foreach $entry (@files) {
    if (-f "$path/$entry") {
      if(! move("$path/$entry", $TRASH_PATH.$inner_path)) {
        my $reason = $!;
        &header();
        &error("削除に失敗しました($reason)。");
        exit(1);
      }
      # cacheの削除
      unlink($CACHE_DIR."/".$path."/".$entry);
    } elsif (-d "$path/$entry") {
      if (! rmdir("$path/$entry")) {  # 空ディレクトリのみ削除可　TODO: ファイルを退避->rmtree
        my $reason = $!;
        &header();
        &error("ディレクトリの削除に失敗しました($reason)");
        exit(1);
      }
    }
  }

  &redirect_to_mediacgi("削除しました", "削除したファイルはTRASHフォルダに移動されます。誤って削除した場合はそこから復元できます。");
}


__EXIT__

