#!/usr/bin/perl

use strict;
use warnings;
use utf8;
use Encode;
use CGI;
use File::Path;
use File::Copy 'copy';
#use GD;

use lib '%libs_dir%';
use ParamPath;
use HTML_Elem;

our $BASE_DIR_CONF;
our $SUPPORT_TYPES;
our $THUMB_SIZE;
our $FFMPEG_CMD;
our $CONVERT_CMD;
our $THM_CACHE_DIR;
our $TMP_FILE;
require '%conf_dir%/thumbnail.conf';

our @support_video_types;
our @support_image_types;
require $SUPPORT_TYPES;

my $movie_thumb_cmd = $FFMPEG_CMD." -i \"%%INPUT%%\" -vf \"scale=%%SIZE%%:-1\" -r 1 -vframes 1 -f image2 \"%%OUTPUT%%\"";
my $image_thumb_cmd = $CONVERT_CMD." \"%%INPUT%%\" -thumbnail %%SIZE%% -strip \"%%OUTPUT%%\"";

my $form = eval{new CGI};

my $base;
my $path;
my $base_name = HTML_Elem->url_decode(scalar($form->param('dir')));
my $encoded_path = scalar($form->param('file'));
eval {
  my $ins = ParamPath->new(base_dir_conf => $BASE_DIR_CONF);
  $ins->init_by_base_name($base_name);
  $path = decode('utf-8', $ins->urlpath_decode($encoded_path));
  $base = $ins->{base};
};
if ($@) {
  print STDERR "thumbnail ERROR - $@\n";
  print "Content-Type: image/jpeg\n";
  print "Content-Length: 0\n";
  print "\n";
  exit(1);
}

my $ret = &thumbnail_cache($base_name, $base, $path);

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
        $ret = &thumbnail_cmd($image_thumb_cmd, ${base}, ${path});
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
  my $cache_path = encode('utf-8', $THM_CACHE_DIR."/".$param_dir."/".$path);

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

  copy("${thm_file}", encode('utf-8', "$cache_path"));
  utime(undef, $lastmodified, encode('utf-8', "$cache_path"));

  return 0;
}

# コマンドからサムネイルを作成
sub thumbnail_cmd
{
  my ($cmd, $base, $path) = @_;

  $SIG{HUP} = $SIG{INT} = $SIG{PIPE} = $SIG{QUIT} = $SIG{TERM} = \&remove_temp;

  $cmd =~ s/%%INPUT%%/${base}${path}/;
  $cmd =~ s/%%OUTPUT%%/${TMP_FILE}/;
  $cmd =~ s/%%SIZE%%/${THUMB_SIZE}/;
  my $ret = system(encode('utf-8', $cmd)." 2>/dev/null >/dev/null");
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
    eval { # 失敗した時に TMP_FILE が残ることをevalで防ぐ
      &save_thumcache($base_name, $base, $path, ${TMP_FILE});
    };
  }

  unlink("${TMP_FILE}");
  return $ret;
}

sub remove_temp
{
  unlink("${TMP_FILE}");
}
