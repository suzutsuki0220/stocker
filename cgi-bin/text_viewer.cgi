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
require '%conf_dir%/stocker.conf';

my $form = eval{new CGI};

my $path;
my $base;
my $base_name;
eval {
  my $ins = ParamPath->new(base_dir_conf => $BASE_DIR_CONF,
                           param_dir => $form->param('dir'));
  $ins->init();
  $path = $ins->inode_to_path($form->param('in'));
  $base = $ins->{base};
  $base_name = $ins->{base_name};
};
if ($@) {
  HTML_Elem->header();
  HTML_Elem->error($@);
}

HTML_Elem->header();

my $file_name = $path;
$file_name =~ s/[^\/]*\///g;

my $msg = <<EOF;
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
    $buffer .= decode($guess->name, $data);
  } else {
    $buffer .= decode('utf-8', $data);
  }
}
close $media;
print encode('utf-8', HTML_Elem->escape_html($buffer));

print "</pre>\n";
print "</form>\n";
HTML_Elem->tail();

exit(0);

