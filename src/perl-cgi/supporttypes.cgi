#!/usr/bin/perl

use strict;
use warnings;
use utf8;
use CGI;
use Encode;

use ParamPath;
use MimeTypes;
use FileTypes;

our $SUPPORT_TYPES;
require $ENV{'STOCKER_CONF'} . '/stocker.conf';

our @support_video_types;
our @support_audio_types;
our @support_image_types;
our @support_gps_types;
our @support_txt_types;
our @support_doc_types;
our @support_excel_types;
our @support_ppt_types;
our @support_pdf_types;
require $SUPPORT_TYPES;

my $movie_pattern = FileTypes->makeSuffixPattern(\@support_video_types);
my $music_pattern = FileTypes->makeSuffixPattern(\@support_audio_types);
my $photo_pattern = FileTypes->makeSuffixPattern(\@support_image_types);
my $gps_pattern = FileTypes->makeSuffixPattern(\@support_gps_types);
my $txt_pattern = FileTypes->makeSuffixPattern(\@support_txt_types);
my $doc_pattern = FileTypes->makeSuffixPattern(\@support_doc_types);
my $excel_pattern = FileTypes->makeSuffixPattern(\@support_excel_types);
my $ppt_pattern = FileTypes->makeSuffixPattern(\@support_ppt_types);
my $pdf_pattern = FileTypes->makeSuffixPattern(\@support_pdf_types);

print <<EOD;
{
  movie_pattern: "${movie_pattern}",
  music_pattern: "${music_pattern}",
  photo_pattern: "${photo_pattern}",
  gps_pattern:   "${gps_pattern}",
  txt_pattern:   "${txt_pattern}",
  doc_pattern:   "${doc_pattern}",
  excel_pattern: "${excel_pattern}",
  ppt_pattern:   "${ppt_pattern}",
  pdf_pattern:   "${pdf_pattern}"
}
EOD
