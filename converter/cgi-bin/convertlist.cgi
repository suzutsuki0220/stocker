#!/usr/bin/perl

use strict;
use warnings;
use utf8;
use Encode;
use Encode::Guess;
use CGI;

use lib '%libs_dir%';
#use ParamPath;
use HTML_Elem;
use ConverterJob;

HTML_Elem->header();

my $msg = <<EOF;
<h2>エンコードリスト</h2>
<hr>
EOF
print encode('utf-8', $msg);

our $STOCKER_CGI    = "";
our $ENCBATCH_LIST  = "";
require '%conf_dir%/converter.conf';

my $buffer;
my $guess;
my $i = 1;

my $job  = ConverterJob->new(listfile => $ENCBATCH_LIST);
my @list = $job->list();

&print_table_head();

foreach my $job_num (@list) {
  print "<tr>\n<td>$i</td>";
  &make_desc(\$job, $job_num);
  print "</tr>\n";
  $i++;
}
print "</table>\n";

HTML_Elem->tail();

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

sub print_table_head {
  my $msg = <<EOF;
<table border="1">
<tr>
  <th>No.</th>
  <th>入力ファイル</th>
  <th>出力先</th>
  <th>2パスエンコード</th>
  <th>フォーマット</th>
  <th>映像ビットレート</th>
  <th>フレームレート</th>
  <th>音声チャンネル数</th>
  <th>音声サンプリングレート</th>
  <th>音声ビットレート</th>
</tr>
EOF
  print encode('utf-8', $msg);
}

sub make_desc {
  my($job, $job_num) = @_;

  $$job->get($job_num);

  print "<td>".$$job->{'source'}."</td>";
  print "<td>".$$job->{'out_dir'}."</td>";
  print "<td>".$$job->{'pass2'}."</td>";
  print "<td>".$$job->{'format'}."</td>";
  print "<td>".$$job->{'v_b'}."</td>";
  print "<td>".$$job->{'v_r'}."</td>";
  print "<td>".$$job->{'a_ac'}."</td>";
  print "<td>".$$job->{'a_ar'}."</td>";
  print "<td>".$$job->{'a_ab'}."</td>";
}
