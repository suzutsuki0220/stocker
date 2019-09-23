#!/usr/bin/perl

use strict;
use warnings;
use utf8;
use Encode;
use Encode::Guess;
use CGI;

use HTML_Elem;
use ConverterJob;

our $STOCKER_CGI    = "";
our $ENCBATCH_LIST  = "";
require $ENV{'STOCKER_CONF'} . '/converter.conf';

my $script = $ENV{'SCRIPT_NAME'};

my $form = eval{new CGI};
my $mode = decode('utf-8', $form->param('mode'));

if ($mode eq "xml_upload") {
  &xml_upload_work();
  exit(0);
}

HTML_Elem->header();

my $msg = <<EOF;
<h2>エンコードリスト</h2>
<form action="${script}" name="f1" method="POST" enctype="multipart/form-data">
<input type="hidden" name="mode" value="xml_upload">
parameter.xmlからエンコードJobを登録: <input type="file" name="xml_file">
<input type="submit" value="アップロード">
</form>
<hr>
EOF
print encode('utf-8', $msg);

eval {
  my $job  = ConverterJob->new(listfile => $ENCBATCH_LIST);
  my @list = $job->list();

  my $i = 1;

  &print_table_head();

  foreach my $job_num (@list) {
    print "<tr>\n<td>$i</td>";
    &make_desc(\$job, $job_num);
    print "</tr>\n";
    $i++;
  }
  print "</table>\n";
};
if ($@) {
  print "<p>Jobは登録されていません</p>";
}

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

sub xml_upload_work {
  eval {
    my $job = ConverterJob->new(listfile => $ENCBATCH_LIST);

    my $buffer = "";
    my $fh = $form->upload('xml_file');
    while(<$fh>) {
      $buffer .= $_;
    }

    $job->add_xml($buffer);
  };
  if ($@) {
    HTML_Elem->header();
    HTML_Elem->error($@);
  }

  print "Location: ${script}\n\n";
}

