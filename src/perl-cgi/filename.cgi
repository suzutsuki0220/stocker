#!/usr/bin/perl

use strict;
use warnings;
use utf8;

use CGI;
use Encode;
use File::Path;

use lib '%libs_dir%';
use ParamPath;
use HTML_Elem;

our $STOCKER_CGI;
require '%conf_dir%/stocker.conf';

my $form = eval{new CGI};

my $base_name = HTML_Elem->url_decode(scalar($form->param('dir')));
my $encoded_dir = HTML_Elem->url_encode(encode('utf-8', $base_name));

my $first = 1;
my @files = $form->multi_param('file');
foreach (@files) {
  my $path = $_;
  my $location = ParamPath->get_up_path(ParamPath->urlpath_decode($path));
  my $back = "${STOCKER_CGI}?file=" . ParamPath->urlpath_encode(encode('utf-8', $location)) . "&dir=" . $encoded_dir;
  my $name = ParamPath->get_filename(ParamPath->urlpath_decode($path));

  if ($first == 1) {
    print "Content-Type: text/json\n\n";
    print "[";
    $first = 0;
  } else {
    print ",";
  }

  print "{\"back\": \"" . $back . "\", \"path\": \"". $path . "\", \"location\": \"" . $location . "\", \"name\": \"". $name . "\"}";
}

if ($first == 0) {
  print "]";
} else {
  print "Status: 400\n\n";
}
