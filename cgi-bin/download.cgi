#!/usr/bin/perl

use strict;
use warnings;
use utf8;
use CGI;
use Encode;

use lib '%libs_dir%';
use ParamPath;
use MimeTypes;
use HTML_Elem;

our $BASE_DIR_CONF;
require '%conf_dir%/stocker.conf';

my $form = eval{new CGI};
my $path;
my $base;
#my $base_name;
eval {
  my $ins = ParamPath->new(base_dir_conf => $BASE_DIR_CONF,
                           param_dir => $form->param('dir'));
  $ins->init();
  $path = $ins->inode_to_path($form->param('in'));
  $base = $ins->{base};
#  $base_name = $ins->{base_name};
};
if ($@) {
  print "Status: 404 Not found\n\n";
  print "$@";
  exit(1);
}

if( -f "${base}${path}" ) {
  my $file_name = $path;
  $file_name =~ s/[^\/]*\///g;

  $file_name =~ /\.(.{1,})$/;
  my $extention = $1;

  print "Content-Type: ".MimeTypes->content_type($extention)."\n";
  print "Content-Length: ". (-s "${base}${path}") ."\n";
  if (HTML_Elem->isSP()) {
    print "Content-Disposition: attachment; filename=".${file_name}."\n";
  } else {
    # RFC 6266 style for PC browser (newer IE9, FireFox22, Safari6)
    my $url_encode;
    $url_encode = HTML_Elem->url_encode($file_name);
    print "Content-Disposition: attachment; filename*=UTF-8''${url_encode}\n";
  }
  print "\n";
  open(my $fin, "${base}${path}") or die("media file open error");
  while(my $buf = <$fin>) {
    print $buf;
  }
  close $fin;
} else {
  print "Status: 404 Not found\n\n";
  print "not a regular file";
}

exit(0);
