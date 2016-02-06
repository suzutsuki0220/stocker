#!/usr/bin/perl

use strict;
use warnings;
use utf8;
use CGI;
use File::Copy;
use File::Path;

our $BASE_DIR_CONF;
our $MOVIE_IMAGE_CACHE_DIR = "";
our $TMP_FILE = "";
our $FFMPEG_CMD = "";
require '%conf_dir%/converter.conf';

@in = parseInput();

my $base = "";
foreach $lst (@MEDIA_DIRS) {
  if($in{'dir'} eq @{$lst}[1]) {
    $base = @{$lst}[2];
    last;
  }
}
$path = &inode_to_path($base, $in{'in'});

my $file_name = $path;
$file_name =~ s/[^\/]*\///g;

if(length($in{'in'}) == 0 || length($base) == 0 || ! -f "${base}${path}") {
  print "Content-Type: image/jpeg\n";
  print "Content-Length: 0\n";
  print "\n";
  exit(1);
}

my $cache = $CACHE_DIR.$path;
my $size;
if($in{'size'} && $in{'size'} != 0) {
  # If size set 0 it output original data
  if( $in{'size'} > 0 && $in{'size'} < 5000 ) {
    $size = $in{'size'};
  }
}

my $lastmodified = (stat ${base}.${path})[9];

if ($in{'size'} == 640 && ! $in{'ss'} && ! $in{'enable_adjust'}) {
  if (&img_fromcache($cache, $lastmodified) == 0) {
    exit(0);
  }
}

if (&make_imgcache($cache, $lastmodified, $size) != 0)
{
  print "Content-Type: image/jpeg\n";
  print "Content-Length: 0\n";
  print "\n";
  exit(1);
}

exit(0);


##

sub img_fromcache()
{
  my ($cache, $lastmodified) = @_;

  if( -f $cache) {
    my $cachemodified = (stat $cache)[9];
    if($cachemodified == $lastmodified) {
      if(open(MEDIA, $cache)) {
        print "Content-Type: image/jpeg\n";
        print "Content-Length: ". (-s $cache). "\n";
        #print "Content-Disposition: inline; filename=$size_$file_name\n";
        print "\n";
        while($inData = <MEDIA>) {
          print $inData;
        }
        close MEDIA;
        return 0;
      }
    } else {
      unlink($cache);
    }
  }
  return -1;
}

sub make_imgcache()
{
  my ($cache, $lastmodified, $size) = @_;
  my $option = "";

  my $position = "";
  if ($in{'ss'} && $in{'ss'} ne '00:00:00.000') {
    $position = "-ss $in{'ss'}";
  }
  my @vf_option = ();
  if($in{'enable_crop'}) {
    push(@vf_option, "crop=".$in{'crop_w'}.":".$in{'crop_h'}.":".$in{'crop_x'}.":".$in{'crop_y'});
  }
  if($in{'enable_pad'}) {
    push(@vf_option, "pad=".$in{'pad_w'}.":".$in{'pad_h'}.":".$in{'pad_x'}.":".$in{'pad_y'}.":".$in{'pad_color'});
  }
  if ($in{'enable_adjust'}) {
    push(@vf_option, "mp=eq2=$in{'gamma'}:$in{'contrast'}:$in{'brightness'}:1.0:$in{'rg'}:$in{'gg'}:$in{'bg'}:$in{'weight'}");
    push(@vf_option, "hue=h=$in{'hue'}:s=$in{'saturation'}");
    push(@vf_option, "unsharp=3:3:$in{'sharp'}");
  }
  my $numerator   = $in{'aspect_numerator'};
  my $denominator = $in{'aspect_denominator'};
  if ($in{'aspect_set'} eq "setsar") {
    push(@vf_option, "setsar=ratio=${numerator}/${denominator}:max=1000");
  } elsif ($in{'aspect_set'} eq "setdar") {
    push(@vf_option, "setdar=ratio=${numerator}/${denominator}:max=1000");
  }
  if (length($size) > 0) {
    push(@vf_option, "scale=". $in{'size'} . ":-1");  #  width
  }

  if ($#vf_option >= 0) {
    $option .= "-vf \"";
    foreach (@vf_option) {
      $option .= $_ . ",";
    }
    $option =~ s/,$//;
    $option .= "\" ";
  }
  $MOVIE_IMG_CMD =~ s/%%POSITION%%/${position}/;
  $MOVIE_IMG_CMD =~ s/%%INPUT%%/${base}${path}/;
  $MOVIE_IMG_CMD =~ s/%%OUTPUT%%/$TMP_FILE/;
  $MOVIE_IMG_CMD =~ s/%%OPTION%%/${option}/;
  system($MOVIE_IMG_CMD);

  print "Content-Type: image/jpeg\n";
  print "Content-Length: ". (-s $TMP_FILE). "\n";
  #print "Content-Disposition: inline; filename=$size_$file_name\n";
  print "\n";
  open(MEDIA, $TMP_FILE) or die("media file open error");
  while($inData = <MEDIA>) {
    print $inData;
  }
  close MEDIA;

  if (! $in{'ss'} && ! $in{'enable_adjust'}) {
    if ($in{'size'} == 640 && length($position) == 0) {
      &save_imgcache($cache, $lastmodified);
    }
  }
  unlink($TMP_FILE);

  return 0;
}

sub save_imgcache()
{
  my ($cache, $lastmodified) = @_;
  my $cache_dir =  ${cache};
     $cache_dir =~ s/[^\/]{1,}$//;

  if(! -d "${cache_dir}") {
    if(! mkpath("${cache_dir}")) {
      my $reason = $!;
      print "Content-Type: image/jpeg\n";
      print "Content-Length: 0\n";
      print "\n";
      print STDERR "Thumbnail generate missing. ($reason)";
      return -1;
    }
  }
  copy($TMP_FILE, $cache);
  utime(undef, $lastmodified, $cache);

  return 0;
}
