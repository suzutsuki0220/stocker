#!/usr/bin/perl

use utf8;
use Encode::Guess;

require './media_cgi.lib';
require '/etc/media_cgi.conf';

&header();

my $msg = <<EOF;
<h2>エンコードリスト</h2>
<hr>
EOF
print encode('utf-8', $msg);

my $buffer;
my $guess;
my $i = 1;

&print_table_head();
open(MEDIA, "$ENCBATCH_LIST") or die("media file open error");
while($inData = <MEDIA>) {
  $guess = guess_encoding($inData, qw/7bit-jis cp932 utf-8/);
  if(ref($guess)) {
    $buffer .= decode($guess->name, $inData);
  } else {
    $buffer .= decode('utf-8', $inData);
  }
  &print_parse_cmd($i, $buffer);
  #print encode('utf-8', &escape($buffer));
  $buffer = "";
  $i++;
}
close MEDIA;
print "</table>\n";
&tail();

exit(0);

#####

sub escape {
  my($string) = @_;
  $string =~ s/&/&amp;/g;
  $string =~ s/"/&quot;/g;
  $string =~ s/</&lt;/g;
  $string =~ s/>/&gt;/g;

  return $string;
}

sub print_parse_cmd {
  my($i, $line) = @_;
  my $opt_key = "";
  my $opt_val = "";
  my @lst;
  my @spl = split(/ /, $line);  # TODO: ファイル名に空白があると切れてしまうので自前で作る必要あり
  my $cmd_name = shift(@spl);

  if (${cmd_name} !~ /ffmpeg$/) {
    return;
  }

  foreach my $peace (@spl) {
    chomp($peace);
    if (length($peace) == 0) {
      next;
    }

    if ($peace =~ /^-/) {
      $opt_key = $peace;
    } else {
      $lst{$opt_key} = $peace;
      $opt_key = "";
    }
  }
  print "<tr>\n<td>$i</td>";
  &make_desc(\%lst);
  print "</tr>\n";
}

sub print_table_head {
  my $msg = <<EOF;
<table border="1">
<tr>
  <th>No.</th>
  <th>入力ファイル</th>
  <th>出力ファイル</th>
  <th>エンコードパス</th>
  <th>映像コーデック</th>
  <th>映像ビットレート</th>
  <th>映像フィルタ</th>
  <th>バッファサイズ</th>
  <th>フレームレート</th>
  <th>音声コーデック</th>
  <th>音声チャンネル数</th>
  <th>音声サンプリングレート</th>
  <th>音声ビットレート</th>
  <th>フォーマット</th>
</tr>
EOF
  print encode('utf-8', $msg);
}

sub make_desc {
  my($lst) = @_;

  print "<td>".$$lst{'-i'}."</td>";
  print "<td>".$$lst{''}."</td>";
  print "<td>".$$lst{'-pass'}."</td>";
  print "<td>".$$lst{'-vcodec'}."</td>";
  print "<td>".$$lst{'-b:v'}."</td>";
  print "<td>".$$lst{'-vf'}."</td>";
  print "<td>".$$lst{'-bufsize'}."</td>";
  print "<td>".$$lst{'-r'}."</td>";
  print "<td>".$$lst{'-acodec'}."</td>";
  print "<td>".$$lst{'-ac'}."</td>";
  print "<td>".$$lst{'-ar'}."</td>";
  print "<td>".$$lst{'-b:a'}."</td>";
  print "<td>".$$lst{'-f'}."</td>";
}
