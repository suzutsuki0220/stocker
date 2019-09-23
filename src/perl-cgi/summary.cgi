#!/usr/bin/perl

use strict;
use warnings;
use utf8;
use CGI;
use Encode;

use ParamPath;
use HTML_Elem;
use MimeTypes;
use FileOperator;

our $HTDOCS_ROOT;
require $ENV{'STOCKER_CONF'} . '/stocker.conf';

eval {
  my @jslist = (
      "${HTDOCS_ROOT}/bundle/stocker.js",
  );
  my @csslist = (
      "${HTDOCS_ROOT}/stocker.css",
  );
  my $html = HTML_Elem->new(
      javascript => \@jslist,
      css => \@csslist
  );
  $html->header();
};
if ($@) {
  HTML_Elem->header();
  HTML_Elem->error($@);
}

my $form = eval{new CGI};
my $in_dir    = (scalar $form->param('dir'));
my $in_file   = (scalar $form->param('file'));
my $encoded_dir = HTML_Elem->url_encode($in_dir);


HTML_Elem->tail();
exit(0);
