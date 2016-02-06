#!/usr/bin/perl

use strict;
use warnings;
use CGI;

use lib '%libs_dir%';
use ParamPath;

our $BASE_DIR_CONF = "";
require '%conf_dir%/music_player.conf';

my $bitrate = "256k";
my $ffmpeg  = "/usr/bin/ffmpeg";

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
  print STDERR "Music Out ERROR: $@\n";
  print "Content-Type: audio/mpeg\n";
  print "Content-Length: 0\n";
  print "\n";
  exit(1);
}

my $media_path = $base.$path;
my $type = lc($form->param('type'));

if($type eq "wav") {
  if(lc($media_path) =~ /\.wav$/) {
     &output_wav(0);
  } else {
     &output_wav(1);
  }
} elsif($type eq "ogg") {
  if(lc($media_path) =~ /\.ogg$/) {
     &output_ogg(0);
  } else {
     &output_ogg(1);
  }
} elsif($type eq "mp3") {
  if(lc($media_path) =~ /\.mp3$/) {
     &output_mp3(0);
  } else {
     &output_mp3(1);
  }
} else {
  print STDERR "Music Out ERROR: unknown filetype [$media_path]\n";
  print "Content-Type: audio/mpeg\n";
  print "Content-Length: 0\n";
  print "\n";
}

exit(0);

#####

sub output_mp3() {
  my ($convert) = @_;
  print "Content-Type: audio/mpeg\n";
  if($convert == 1) {
    print "\n";
    system("${ffmpeg} -y -i \"$media_path\" -vn -acodec libmp3lame -f mp3 -ac 2 -ar 44100 -ab ${bitrate} - 2>/dev/null");
  } else {
    print "Content-Length: ". (-s $media_path) ."\n";
    print "Content-Disposition: attachment; filename=media.mp3\n";
    print "\n";
    open(my $MEDIA, $media_path) or die("media file open error");
    while(my $inData = <$MEDIA>) {
      print $inData;
    }
    close $MEDIA;
  }
}

sub output_ogg() {
  my ($convert) = @_;
  print "Content-Type: audio/ogg\n";
  if($convert == 1) {
    print "\n";
    system("${ffmpeg} -y -i \"$media_path\" -vn -acodec libvorbis -f ogg -ac 2 -ar 44100 -ab ${bitrate} - 2>/dev/null");
  } else {
    print "Content-Length: ". (-s $media_path) ."\n";
    print "Content-Disposition: attachment; filename=media.ogg\n";
    print "\n";
    open(my $MEDIA, $media_path) or die("media file open error");
    while(my $inData = <$MEDIA>) {
      print $inData;
    }
    close $MEDIA;
  }
}

sub output_wav() {
  my ($convert) = @_;
  print "Content-Type: audio/x-wav\n";
  if($convert == 1) {
    print "\n";
    system("${ffmpeg} -y -i \"$media_path\" -vn -acodec pcm_s16le -f wav -ac 2 -ar 44100 - 2>/dev/null");
  } else {
    print "Content-Length: ". (-s $media_path) ."\n";
    print "Content-Disposition: attachment; filename=media.wav\n";
    print "\n";
    open(my $MEDIA, $media_path) or die("media file open error");
    while(my $inData = <$MEDIA>) {
      print $inData;
    }
    close $MEDIA;
  }
}
