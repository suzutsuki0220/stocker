#!/usr/bin/perl

use strict;
use warnings;
use utf8;
use CGI;
use Encode;
use Encode::Guess;

use lib '%libs_dir%';
use ParamPath;
use HTML_Elem;

our $BASE_DIR_CONF;
our $STOCKER_CGI;
require '%conf_dir%/stocker.conf';

my $form = eval{new CGI};

my $path;
my $base;
my $base_name = scalar($form->param('dir'));
my $encoded_path = scalar($form->param('file'));
eval {
  my $ins = ParamPath->new(base_dir_conf => $BASE_DIR_CONF);
  $ins->init_by_base_name(HTML_Elem->url_decode($base_name));
  $path = decode('utf-8', $ins->urlpath_decode($encoded_path));
  $base = $ins->{base};
};
if ($@) {
  HTML_Elem->header();
  HTML_Elem->error($@);
}

HTML_Elem->header();

my $file_name = $path;
$file_name =~ s/[^\/]*\///g;

$base_name = HTML_Elem->url_encode(scalar($form->param('dir')));

my $up_path = ParamPath->get_up_path($path);
my $encoded_up_path = ParamPath->urlpath_encode($up_path);

my $msg = <<EOF;
<a href=\"${STOCKER_CGI}?dir=${base_name}&file=${encoded_up_path}\">← 戻る</a><br>
<h1 style="font-size: 14pt">${file_name}</h1>
<hr>
<pre>
EOF
print encode('utf-8', $msg);

my $buffer;
my $guess;
open(my $media, "${base}${path}") or die("text file open error");
while(my $data = <$media>) {
  $guess = guess_encoding($data, qw/7bit-jis cp932 utf-8/);
  if(ref($guess)) {
    $buffer = decode($guess->name, $data);
  } else {
    $buffer = decode('utf-8', $data);
  }
  $buffer =~ s/(\r\n)|\r/\n/g;
  $buffer = HTML_Elem->escape_html($buffer);
  print encode('utf-8', $buffer);
}
close $media;

print "</pre>\n";
print "</form>\n";
HTML_Elem->tail();

exit(0);

