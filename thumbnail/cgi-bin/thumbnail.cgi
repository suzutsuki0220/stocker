#!/usr/bin/perl

use strict;
use warnings;
use CGI;
use File::Path;
use File::Copy 'copy';
#use GD;

use lib '%libs_dir%';
use ParamPath;

our $BASE_DIR_CONF;
our $SUPPORT_TYPES;
our $THUMB_SIZE;
our $EXIF_CMD;
our $FFMPEG_CMD;
our $CONVERT_CMD;
our $THM_CACHE_DIR;
our $TMP_FILE;
require '%conf_dir%/thumbnail.conf';

our @support_video_types;
our @support_image_types;
require $SUPPORT_TYPES;

my $exif_thumb_cmd = $EXIF_CMD." -e \"%%INPUT%%\" -o \"%%OUTPUT%%\"";
my $movie_thumb_cmd = $FFMPEG_CMD." -i \"%%INPUT%%\" -vf \"scale=%%SIZE%%:-1\" -r 1 -vframes 1 -f image2 \"%%OUTPUT%%\"";
my $image_thumb_cmd = $CONVERT_CMD." \"%%INPUT%%\" -thumbnail %%SIZE%% -strip \"%%OUTPUT%%\"";

my $form = eval{new CGI};
my $f_dir = scalar($form->param('dir'));
my $f_in  = scalar($form->param('in'));

my $base;
my $path;
eval {
  my $ins = ParamPath->new(base_dir_conf => $BASE_DIR_CONF,
                           param_dir => $f_dir);
  $ins->init();
  $path = $ins->inode_to_path($f_in);
  $base = $ins->{base};
};
if ($@) {
  print STDERR "thumbnail ERROR - $@\n";
  print "Content-Type: image/jpeg\n";
  print "Content-Length: 0\n";
  print "\n";
  exit(1);
}

my $ret = &thumbnail_cache($f_dir, $base, $path);

if ($ret != 0) {
  $path =~ /\.(.*)$/;
  my $suffix = $1 ? lc($1) : "";
  foreach my $type (@support_video_types) {
    if ($type eq $suffix) {
      $ret = &thumbnail_cmd($movie_thumb_cmd, ${base}, ${path});
      last;
    }
  }
  if ($ret != 0) {
    foreach my $type (@support_image_types) {
      if ($type eq $suffix) {
        if (($ret = &thumbnail_exif(${base}.${path})) != 0) {
          $ret = &thumbnail_cmd($image_thumb_cmd, ${base}, ${path});
        }
        last;
      }
    }
  }
}
if ($ret != 0) {
  print STDERR "thumbnail ERROR: thumbnail command failed\n";
  print "Content-Type: image/jpeg\n";
  print "Content-Length: 0\n";
  print "\n";
  exit(1);
}

exit(0);

#####

# キャッシュがあればキャッシュを出力
sub thumbnail_cache
{
  my ($param_dir, $base, $path) = @_;

  $THM_CACHE_DIR =~ s/\/{1,}$//g;  # 末尾に"/"が付いていたら消す
  if (! $param_dir || length($param_dir) == 0) {
    $param_dir = "DEFAULT";
  }
  my $cache_path = $THM_CACHE_DIR."/".$param_dir."/".$path;
   
  if(-f "$cache_path") {
    if((-s "$cache_path") == 0) {
      unlink("$cache_path");
      return 1;
    }
    my $lastmodified  = (stat "${base}${path}")[9];
    my $cachemodified = (stat "$cache_path")[9];
    if($cachemodified == $lastmodified) {
      if(open(my $MEDIA, "$cache_path")) {
        print "Content-Type: image/jpeg\n";
        print "Content-Length: ". (-s "$cache_path"). "\n";
        #print "Content-Disposition: inline; filename=$size_$file_name\n";
        print "\n";
        while(<$MEDIA>) {
          print $_;
        }
        close $MEDIA;
        return 0;
      }
    } else {
      unlink("$cache_path");
    }
  }

  return 1;
}

sub save_thumcache
{
  my ($param_dir, $base, $path, $thm_file) = @_;
  my $lastmodified = (stat "${base}${path}")[9];

  $THM_CACHE_DIR =~ s/\/{1,}$//g;  # 末尾に"/"が付いていたら消す
  if (! $param_dir || length($param_dir) == 0) {
    $param_dir = "DEFAULT";
  }
  my $cache_path = $THM_CACHE_DIR."/".$param_dir."/".$path;

  my $cache_dir =  $cache_path;
     $cache_dir =~ s/[^\/]{1,}$//;

  if(! -d $cache_dir) {
    if(! mkpath($cache_dir)) {
      print STDERR "Cache dir make missing [${cache_dir}]- $!\n";
      return 1;
    }
  }

  copy("${thm_file}", "$cache_path");
  utime(undef, $lastmodified, "$cache_path");

  return 0;
}

# exifデータからサムネイルを作成
sub thumbnail_exif
{
  my ($file) = @_;

  $SIG{HUP} = $SIG{INT} = $SIG{PIPE} = $SIG{QUIT} = $SIG{TERM} = \&remove_temp;

  $exif_thumb_cmd =~ s/%%INPUT%%/${file}/;
  $exif_thumb_cmd =~ s/%%OUTPUT%%/${TMP_FILE}/;
  my $ret = system($exif_thumb_cmd." >/dev/null 2>/dev/null");
  if($ret == 0) {
    print "Content-Type: image/jpeg\n";
    print "Content-Length: ". (-s "${TMP_FILE}") ." \n";
    print "\n";
    if(open(my $IMAGE, "${TMP_FILE}")) {
      while(<$IMAGE>) {
        print $_;
      }
      close($IMAGE);
    }
  } else {
    unlink("${TMP_FILE}");
    return 1;
  }

  unlink("${TMP_FILE}");
  return 0;
}
;
# コマンドからサムネイルを作成
sub thumbnail_cmd
{
  my ($cmd, $base, $path) = @_;

  $SIG{HUP} = $SIG{INT} = $SIG{PIPE} = $SIG{QUIT} = $SIG{TERM} = \&remove_temp;

  $cmd =~ s/%%INPUT%%/${base}${path}/;
  $cmd =~ s/%%OUTPUT%%/${TMP_FILE}/;
  $cmd =~ s/%%SIZE%%/${THUMB_SIZE}/;
  my $ret = system($cmd." 2>/dev/null >/dev/null");
  if($ret == 0) {
    print "Content-Type: image/jpeg\n";
    print "Content-Length: ". (-s "${TMP_FILE}") ." \n";
    print "\n";
    if(open(my $IMAGE, "${TMP_FILE}")) {
      while(<$IMAGE>) {
        print $_;
      }
      close($IMAGE);
    }
  } else {
    unlink("${TMP_FILE}");
    return 1;
  }

  eval { # 失敗した時に TMP_FILE が残ることをevalで防ぐ
    &save_thumcache($f_dir, $base, $path, ${TMP_FILE});
  };

  unlink("${TMP_FILE}");
  return 0;
}

## GDライブラリで作成する
#sub thumbnail_gd
#{
#  print "Content-Type: image/jpeg\n\n";
#
#  my $srcImage = new GD::Image(${base}.${path});
#  my($srcWidth, $srcHeight) = $srcImage->getBounds();
#  my $scope = 0;
#  if( $srcWidth > $srcHeight) {
#    $scope = 160 / $srcWidth;
#  } else {
#    $scope = 160 / $srcHeight;
#  }
#  my $dstWidth = int($srcWidth * $scope);
#  my $dstHeight = int($srcHeight * $scope);
#  my $dstImage = new GD::Image($dstWidth,$dstHeight) || return 1;
#  $dstImage->copyResized($srcImage,0,0,0,0,$dstWidth,$dstHeight,$srcWidth,$srcHeight);
#  print $dstImage->jpeg(80);
#  return 0;
#}

sub remove_temp
{
  unlink("${TMP_FILE}");
}
