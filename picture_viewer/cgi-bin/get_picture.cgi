#!/usr/bin/perl

use strict;
use warnings;
use CGI;
use File::Path;
use File::Copy 'copy';

use lib '%libs_dir%';
use ParamPath;

our $BASE_DIR_CONF;
our $VGA_CACHE_DIR = "";
our $TMP_FILE = "";
our $RESIZE_CMD = "";
require '%conf_dir%/picture_viewer.conf';

$VGA_CACHE_DIR =~ s/\/{1,}$//g;  # 末尾に"/"が付いていたら消す

if (length($VGA_CACHE_DIR) == 0) {
  print STDERR "get_picgure.cgi ERROR: missing configuration VGA_CACHE_DIR";
  print "Content-Type: image/jpeg\n";
  print "Content-Length: 0\n";
  print "\n";
  exit(1);
}

#use GD;

my $form = eval{new CGI};

my $base;
my $path;
eval {
  my $ins = ParamPath->new(base_dir_conf => $BASE_DIR_CONF,
                           param_dir => $form->param('dir'));
  $ins->init();
  $path = $ins->inode_to_path($form->param('in'));
  $base = $ins->{base};
};
if ($@) {
  print STDERR "get_picgure.cgi ERROR: $@";
  print "Content-Type: image/jpeg\n";
  print "Content-Length: 0\n";
  print "\n";
  exit(1);
}

my $file_name = $path;
$file_name =~ s/[^\/]*\///g;

if(length($form->param('in')) <= 0 || ! -f "${base}${path}") {
  print STDERR "get_picture.cgi ERROR: image file not found - ${base}${path}";
  print "Content-Type: image/jpeg\n";
  print "Content-Length: 0\n";
  print "\n";
  exit(1);
}

if(length($form->param('size')) == 0 || $form->param('size') == 0) {
  # If size set 0 it output original data
  print "Content-Type: image/jpeg\n";
  print "Content-Disposition: inline; filename=orig_$file_name\n";
  print "Content-Length: ". (-s "${base}${path}") ."\n";
  print "\n";
  open(my $MEDIA, "${base}${path}") or die("media file open error");
  while(my $inData = <$MEDIA>) {
    print $inData;
  }
  close $MEDIA;
  exit(0);
}

my $size = 640;
if($form->param('size') && $form->param('size') > 0 && $form->param('size') < 5000) {
  $size = $form->param('size');
}

my $lastmodified = (stat "${base}${path}")[9];
my $param_dir = $form->param('dir');
if (! $param_dir || length($param_dir) == 0) {
  $param_dir = "DEFAULT";
}
my $cache_path = $VGA_CACHE_DIR."/".$param_dir."/".$path;
my $cache_dir =  $cache_path;
   $cache_dir =~ s/[^\/]{1,}$//;

### If thumbnail cache exists output cache image
eval {
  if($size == 640) {
    if(! -d $cache_dir) {
      if(! mkpath($cache_dir)) {
        print "Content-Type: image/jpeg\n";
        print "Content-Length: 0\n";
        print "\n";
        print STDERR "Cache dir make missing.";
        exit(1);
      }
    }
    # キャッシュから画像を読み込み
    if((-f $cache_path) && ((-s $cache_path) > 0)) {
      my $cachemodified = (stat "$cache_path")[9];
      if($cachemodified == $lastmodified) {
        if(open(my $MEDIA, "$cache_path")) {
          print "Content-Type: image/jpeg\n";
          print "Content-Length: ". (-s "$cache_path"). "\n";
          #print "Content-Disposition: inline; filename=$size_$file_name\n";
          print "\n";
          while(my $inData = <$MEDIA>) {
            print $inData;
          }
          close $MEDIA;
          exit(0);
        }
      } else {
        unlink("$cache_path");
      }
    }
  }
};

#if( $in{'fast'} eq "true" ) {
#  my $srcImage = new GD::Image->newFromJpeg($path);
#  my($srcWidth, $srcHeight) = $srcImage->getBounds();
#  my $scope = 0;
#  if( $srcWidth > $srcHeight) {
#    $scope = $size / $srcWidth;
#  } else {
#    $scope = $size / $srcHeight;
#  }
#  my $dstWidth = int($srcWidth * $scope);
#  my $dstHeight = int($srcHeight * $scope);
#  my $dstImage = new GD::Image($dstWidth,$dstHeight) || die;
#  $dstImage->copyResized($srcImage,0,0,0,0,$dstWidth,$dstHeight,$srcWidth,$srcHeight);
#  print "Content-Type: image/jpeg\n";
#  print "Content-Disposition: inline; filename=preview_$file_name\n";
#  print "\n";
#  print $dstImage->jpeg(80);
#} else {
  $RESIZE_CMD =~ s/%%INPUT%%/${base}${path}/;
  $RESIZE_CMD =~ s/%%OUTPUT%%/${TMP_FILE}/;
  $RESIZE_CMD =~ s/%%SIZE%%/$size/;
  system($RESIZE_CMD);
  print "Content-Type: image/jpeg\n";
  print "Content-Disposition: inline; filename=${size}_${file_name}\n";
  print "Content-Length: ". (-s "${TMP_FILE}"). "\n";
  print "\n";
  open(my $MEDIA, "${TMP_FILE}") or die "image open ERROR - ${TMP_FILE}";
  while(my $inData = <$MEDIA>) {
    print $inData;
  }
  close $MEDIA;

  # キャッシュ保存
  if($size == 640) {
    copy("${TMP_FILE}", "$cache_path");
    utime(undef, $lastmodified, "$cache_path");
  }
  unlink("${TMP_FILE}");

  exit(0);
