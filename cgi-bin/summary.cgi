#!/usr/bin/perl

use strict;
use warnings;
use utf8;
use CGI;
use Encode;

use lib '%libs_dir%';
use ParamPath;
use HTML_Elem;
use MimeTypes;
use FileOperator;

our $BASE_DIR_CONF;
our $BOX_WIDTH;
our $BOX_HEIGHT;
our $BOX_SPACE;
our $MAX_DISPLAY_NAME;
our $SUPPORT_TYPES;
our ($EDIT_CGI, $FILEFUNC_CGI, $CONVERTER_CGI, $MUSIC_PLAYER_CGI, $GPS_VIEWER_CGI);
our ($TEXT_VIEWER_CGI, $PICTURE_VIEWER_CGI, $GET_THUMBNAIL_CGI, $GETFILE_CGI);

eval {
  my @jslist = (
      "%htdocs_root%/bundle.js",
      "%htdocs_root%/stocker_list.js",
      "%htdocs_root%/get_directory_list.js",
  );
  my @csslist = (
      "%htdocs_root%/stocker.css",
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
