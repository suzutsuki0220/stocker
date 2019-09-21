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

our $BASE_DIR_CONF;
require '%conf_dir%/stocker.conf';

my $form = eval{new CGI};

my $first = 1;
my @files = $form->multi_param('file');

eval {
  my $ins = ParamPath->new(base_dir_conf => $BASE_DIR_CONF);
  $ins->init_by_base_name('');
  for (my $i=0; $i<$ins->base_dirs_count(); $i++) {
    my $lst = $ins->get_base_dir_column($i);
    my $name = $lst->{name};
    my $encoded_name = HTML_Elem->url_encode($name);

    if ($first == 1) {
      print "Content-Type: text/json\n\n";
      print "[";
      $first = 0;
    } else {
      print ",";
    }

    print "{\"name\": \"" . encode('utf-8', $name) . "\", \"encoded\": \"" . $encoded_name . "\"}";
  }

  if ($first == 0) {
    print "]";
  } else {
    print "Status: 400\n\n";
  }
};
