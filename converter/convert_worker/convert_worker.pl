#!/usr/bin/perl

use strict;
use warnings;
use utf8;
use Encode;
use File::Path;
use XML::Simple;

use lib '%libs_dir%';
use ParamPath;
use ConverterJob;

our $BASE_DIR_CONF  = "";
our $FFMPEG_CMD     = "";
our $TMP_PATH       = "";
our $CONV_OUT_DIR   = "";
our $ENCODE_BATCH   = "";
our $ENCBATCH_LIST  = "";
require '%conf_dir%/converter.conf';

while(1) {
  if (-f "$ENCBATCH_LIST") {
    my $job = ConverterJob->new(listfile => "$ENCBATCH_LIST");
    if ($job) {
      my @list = $job->list();
      if ($#list == 0) {
	unlink("$ENCBATCH_LIST");
	continue;
      }
      &do_encode(\$job, $list[0]);
      continue;
    } else {
      print STDERR "failed to make ConvertJob instance\n";
      unlink("$ENCBATCH_LIST");
      continue;
    }
  }
  sleep(60);
}

exit 0;

#####

sub do_encode
{
  my ($job, $job_num) = @_;

  $$job->get($job_num);
  $$job->del($job_num);

  print $$job->{'source'}."\n";

  return;
}
