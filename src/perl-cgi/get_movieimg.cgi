#!/usr/bin/perl

use strict;
#use warnings;
use utf8;
use Encode;
use CGI;
use File::Copy;
use File::Path;

use ParamPath;
use HTML_Elem;

our $BASE_DIR_CONF;
our $MOVIE_IMAGE_CACHE_DIR = "";
our $TMP_PATH = "";
our $FFMPEG_CMD = "";
require $ENV{'STOCKER_CONF'} . '/converter.conf';

$SIG{HUP} = $SIG{INT} = $SIG{PIPE} = $SIG{QUIT} = $SIG{TERM} = \&remove_temp;

my $MOVIE_IMG_CMD = "${FFMPEG_CMD} %%POSITION%% -i \"%%INPUT%%\" %%OPTION%% -r 1 -vframes 1 -f image2 \"%%OUTPUT%%\" 2>/dev/null";

my $form = eval{new CGI};

my $base;
my $path;
my $base_name = HTML_Elem->url_decode(scalar($form->param('dir')));
my $encoded_path = scalar($form->param('file'));
eval {
  my $ins = ParamPath->new(base_dir_conf => $BASE_DIR_CONF);
  $ins->init_by_base_name($base_name);
  $path = decode('utf-8', $ins->urlpath_decode($encoded_path));
  $base = $ins->{base}
};
if ($@) {
  &error("get_movieimg.cgi ERROR: $@");
}

my $media_path = encode('utf-8', "${base}${path}");
if(length(${path}) <= 0 || ! -f ${media_path}) {
  &error("get_movieimg.cgi ERROR: file not found - " . decode('utf-8', ${media_path}));
}

my $file_name = $path;
$file_name =~ s/[^\/]*\///g;

my $param_dir = $base_name;
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

my $lastmodified = (stat ${media_path})[9];

if (&judgeMakeCache($size) == 1) {
  if (&img_fromcache($cache, $lastmodified) == 0) {
    exit(0);
  }
}

if (&make_movie_image($cache, $lastmodified, $size) != 0)
{
  &error("failed to make image cache");
}

exit(0);

##

sub judgeMakeCache()
{
  my ($size) = @_;

  my $f_v_map = scalar($form->param('v_map'));
  if (length($f_v_map) != 0 && $f_v_map ne '0' && $f_v_map ne '1') {
    return 0;
  }

  if ($size == 640 && ! $form->param('enable_adjust') && ! $form->param('enable_crop') && ! $form->param('enable_pad')) {
    if (!$form->param('set_position') || $form->param('ss') eq '00:00:00.000') {
      return 1;
    }
  }
  return 0;
}

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

sub make_movie_image()
{
  my ($cache, $lastmodified, $size) = @_;
  my $option = "";

  my $position = "";
  if ($form->param('set_position') && $form->param('ss') ne '00:00:00.000') {
    $position = "-ss ".$form->param('ss');
  }
  my @vf_option = ();
  if($form->param('enable_crop')) {
    push(@vf_option, "crop=".$form->param('crop_w').":".$form->param('crop_h').":".$form->param('crop_x').":".$form->param('crop_y'));
  }
  if($form->param('enable_pad')) {
    push(@vf_option, "pad=".$form->param('pad_w').":".$form->param('pad_h').":".$form->param('pad_x').":".$form->param('pad_y').":".$form->param('pad_color'));
  }
  if ($form->param('enable_adjust')) {
    push(@vf_option, "eq=gamma=".$form->param('gamma').":contrast=".$form->param('contrast').":brightness=".$form->param('brightness').":gamma_r=".$form->param('rg').":gamma_g=".$form->param('gg').":gamma_b=".$form->param('bg').":gamma_weight=".$form->param('weight'));
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

  if (length($form->param('v_map')) != 0) {
    $option .= " -map 0:".$form->param('v_map');
  }

  if ($#vf_option >= 0) {
    $option .= " -vf \"";
    foreach (@vf_option) {
      $option .= $_ . ",";
    }
    $option =~ s/,$//;
    $option .= "\" ";
  }
  my $cmd_movie_img = $MOVIE_IMG_CMD;
  $cmd_movie_img =~ s/%%POSITION%%/${position}/;
  $cmd_movie_img =~ s/%%INPUT%%/${base}${path}/;
  $cmd_movie_img =~ s/%%OUTPUT%%/$TMP_PATH/;
  $cmd_movie_img =~ s/%%OPTION%%/${option}/;
  system(encode('utf-8', $cmd_movie_img));

  print "Content-Type: image/jpeg\n";
  print "Content-Length: ". (-s $TMP_PATH). "\n";
  #print "Content-Disposition: inline; filename=$size_$file_name\n";
  print "\n";
  open(my $fd, $TMP_PATH) or die("media file open error");
  while(my $inData = <$fd>) {
    print $inData;
  }
  close $fd;

  if (&judgeMakeCache($size) == 1) {
    &save_imgcache($cache, $lastmodified);
  }
  unlink($TMP_PATH);

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
      print STDERR "Thumbnail generate missing. ($reason)";
      return -1;
    }
  }
  copy($TMP_PATH, $cache);
  utime(time, $lastmodified, $cache);

  return 0;
}

sub remove_temp
{
  unlink("${TMP_PATH}");
}

sub error
{
  my($message) = @_;
  print STDERR $message . "\n";
  print "Status: 400\n\n";
  exit(1);
}

