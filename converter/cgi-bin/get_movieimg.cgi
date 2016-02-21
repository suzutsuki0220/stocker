#!/usr/bin/perl

use strict;
#use warnings;
use utf8;
use CGI;
use File::Copy;
use File::Path;

use lib '%libs_dir%';
use ParamPath;

our $BASE_DIR_CONF;
our $MOVIE_IMAGE_CACHE_DIR = "";
our $TMP_FILE = "";
our $FFMPEG_CMD = "";
require '%conf_dir%/converter.conf';

my $MOVIE_IMG_CMD = "${FFMPEG_CMD} %%POSITION%% -i \"%%INPUT%%\" %%OPTION%% -r 1 -vframes 1 -f image2 \"%%OUTPUT%%\" 2>/dev/null";

my $form = eval{new CGI};

my $base;
my $path;
eval {
  my $ins = ParamPath->new(base_dir_conf => $BASE_DIR_CONF,
                           param_dir => $form->param('dir'));
  $ins->init();
  $path = $ins->inode_to_path($form->param('in'));
  $base = $ins->{base}
};
if ($@) {
  print STDERR "get_movieimg.cgi ERROR: $@\n";
  print "Content-Type: image/jpeg\n";
  print "Content-Length: 0\n";
  print "\n";
  exit(1);
}

if(length($form->param('in')) <= 0 || ! -f "${base}${path}") {
  print STDERR "get_movieimg.cgi ERROR: file not found - ${base}${path}";
  print "Content-Type: image/jpeg\n";
  print "Content-Length: 0\n";
  print "\n";
  exit(1);
}

my $file_name = $path;
$file_name =~ s/[^\/]*\///g;

my $param_dir = $form->param('dir');
if (! $param_dir || length($param_dir) == 0) {
  $param_dir = "DEFAULT";
}
$MOVIE_IMAGE_CACHE_DIR =~ s/\/{1,}$//g;  # 末尾に"/"が付いていたら消す
my $cache = $MOVIE_IMAGE_CACHE_DIR ."/". $param_dir ."/". $path;

my $size = 640;
if($form->param('size') && $form->param('size') != 0) {
  # If size set 0 it output original data
  if( $form->param('size') > 0 && $form->param('size') < 5000 ) {
    $size = $form->param('size');
  }
}

my $lastmodified = (stat ${base}.${path})[9];

if ($form->param('size') == 640 && ! $form->param('ss') && ! $form->param('enable_adjust')) {
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
      if(open(my $fd, $cache)) {
        print "Content-Type: image/jpeg\n";
        print "Content-Length: ". (-s $cache). "\n";
        #print "Content-Disposition: inline; filename=$size_$file_name\n";
        print "\n";
        while(my $inData = <$fd>) {
          print $inData;
        }
        close $fd;
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
  if ($form->param('ss') && $form->param('ss') ne '00:00:00.000') {
    $position = "-ss $form->param('ss')";
  }
  my @vf_option = ();
  if($form->param('enable_crop')) {
    push(@vf_option, "crop=".$form->param('crop_w').":".$form->param('crop_h').":".$form->param('crop_x').":".$form->param('crop_y'));
  }
  if($form->param('enable_pad')) {
    push(@vf_option, "pad=".$form->param('pad_w').":".$form->param('pad_h').":".$form->param('pad_x').":".$form->param('pad_y').":".$form->param('pad_color'));
  }
  if ($form->param('enable_adjust')) {
    push(@vf_option, "mp=eq2=".$form->param('gamma').":".$form->param('contrast').":".$form->param('brightness').":1.0:".$form->param('rg').":".$form->param('gg').":".$form->param('bg').":".$form->param('weight'));
    push(@vf_option, "hue=h=".$form->param('hue').":s=".$form->param('saturation'));
    push(@vf_option, "unsharp=3:3:".$form->param('sharp'));
  }
  my $numerator   = $form->param('aspect_numerator');
  my $denominator = $form->param('aspect_denominator');
  if ($form->param('aspect_set') eq "setsar") {
    push(@vf_option, "setsar=ratio=${numerator}/${denominator}:max=1000");
  } elsif ($form->param('aspect_set') eq "setdar") {
    push(@vf_option, "setdar=ratio=${numerator}/${denominator}:max=1000");
  }
  if (length($size) > 0) {
    push(@vf_option, "scale=". $form->param('size') . ":-1");  #  width
  }

  if ($#vf_option >= 0) {
    $option .= "-vf \"";
    foreach (@vf_option) {
      $option .= $_ . ",";
    }
    $option =~ s/,$//;
    $option .= "\" ";
  }
  my $cmd_movie_img = $MOVIE_IMG_CMD;
  $cmd_movie_img =~ s/%%POSITION%%/${position}/;
  $cmd_movie_img =~ s/%%INPUT%%/${base}${path}/;
  $cmd_movie_img =~ s/%%OUTPUT%%/$TMP_FILE/;
  $cmd_movie_img =~ s/%%OPTION%%/${option}/;
  system($cmd_movie_img);

  print "Content-Type: image/jpeg\n";
  print "Content-Length: ". (-s $TMP_FILE). "\n";
  #print "Content-Disposition: inline; filename=$size_$file_name\n";
  print "\n";
  open(my $fd, $TMP_FILE) or die("media file open error");
  while(my $inData = <$fd>) {
    print $inData;
  }
  close $fd;

  if (! $form->param('ss') && ! $form->param('enable_adjust')) {
    if ($form->param('size') == 640 && length($position) == 0) {
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
