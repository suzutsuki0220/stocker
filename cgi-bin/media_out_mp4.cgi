#!/usr/bin/perl

require './media_cgi.lib';
require '/etc/media_cgi.conf';

$|=1;
@in = parseInput();

@WEEK=("Sun","Mon","Tue","Wed","Thu","Fri","Sat");
@MONTH=("Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec");

my $base;
foreach $lst (@MEDIA_DIRS) {
  if($in{'dir'} eq @{$lst}[1]) {
    $base = @{$lst}[2];
    last;
  }
}
$path = &inode_to_fullpath($base, $in{'in'});

if(length($in{'in'}) <= 0 ) {
  print "Content-Type: text/plain\n";
  print "Content-Length: 0\n";
  print "\n";
  exit(1);
}

if(! -f $path) {
  print "Content-Type: text/plain\n";
  print "Content-Length: 0\n";
  print "\n";
  exit(1);
}

my @range;
## try -> curl --range 0-99 http://192.168.0.241/cgi-bin/show_mp4.cgi?in=/78342046/91947066/91947067/91947076 -o /dev/null
if($ENV{'HTTP_RANGE'}) {
  my $http_range = $ENV{'HTTP_RANGE'};
  if( $http_range !~ /^bytes=/ ) {
    print "Status: 416\n\n";
    exit(1);
  }
  $http_range =~ s/^bytes=//;
  if( $http_range =~ /[^0-9\-,]/ ) {
    print "Status: 416\n\n";
    exit(1);
  }
  @range = split(",", $http_range);

  my $boundary = "";
  if($#range > 0) {
    $boundary = $ENV{'UNIQUE_ID'};
  }

  # Check ranges and calculate Content-Length
  my $length = 0;
  foreach $x (@range) {
    my($start, $end) = split("-", $x);
    if(! $start) { $start = 0; }
    if(! $end) { $end = (-s $path); }
    if($end < $start) {
      print "Status: 416\n\n";
      exit(1);
    }
    if($boundary ne "") {
      $length += 2+2+length($boundary)+2;  # "\n--$boundary\n(cr+cf)"
      $length += 25; # Content-Type: video/mp4\n(cr+cf)
      $length += 21+length($start)+1+length($end)+1+length(-s $path)+2; # Content-Range: bytes $start-$end/". (-s $path) ."\n(cr+cf)"
      $length += 2;  # "\n(cr+cf)"
    }
    $length +=  $end-$start+1;  # part of content
  }
  if($boundary ne "") {
    $length += 2+2+length($boundary)+2+2;  # "\n--$boundary--\n(cr+cf)";
  }

  print "Status: 206\n";
  print "Accept-Ranges: bytes\n";
  print "Content-Length: ". $length ."\n";

  # Last Modified
#  my $last_mod = (stat "$path")[9];
#  my ($sec,$min,$hour,$mday,$mon,$year,$wday) = (gmtime($last_mod))[0..6];
#  $mon=$MONTH[$mon];
#  $year+=1900;
#  $wday=$WEEK[$wday];
#  printf ("Last-Modified: %s, %02d %s %d %02d:%02d:%02d GMT\n", $wday,$mday,$mon,$year,$hour,$mon,$sec);

  if($#range > 0) {
    print "Content-Type: multipart/byteranges; boundary=$boundary\n";
    print "\n";
  }

  foreach $x (@range) {
    if($boundary ne "") {
      print "\n--$boundary\n";
    }

    my($start, $end) = split("-", $x);
    if(! $start) { $start = 0; }
    if(! $end) { $end = (-s $path); }

#    if($start == 0 && $end == 1) {
#      print "STatus: 304\n\n";
#      exit(0);
#    }

    my $size = $end-$start+1;
    print "Content-Type: video/mp4\n";
    print "Content-Range: bytes $start-$end/". (-s $path) ."\n";
    print "\n";

    system("/srv/www/192.168.0.241/bin/outbin \"$path\" $start $size");
  }
  if($boundary ne "") {
    print "\n--$boundary--\n";
  }

  exit(0);
} else {
## mobile safari needs Accept-Ranges header
## See: http://developer.apple.com/library/safari/#documentation/AppleApplications/Reference/SafariWebContent/CreatingVideoforSafarioniPhone/CreatingVideoforSafarioniPhone.html#//apple_ref/doc/uid/TP40006514-SW6

  print "Content-Type: video/mp4\n";
  print "Accept-Ranges: bytes\n";
#  print "Content-Disposition: inline; filename=output.mp4\n";
  print "Content-Length: ". (-s $path) ."\n";

  # Last Modified
#  my $last_mod = (stat "$path")[9];
#  my ($sec,$min,$hour,$mday,$mon,$year,$wday) = (gmtime($last_mod))[0..6];
#  $mon=$MONTH[$mon];
#  $year+=1900;
#  $wday=$WEEK[$wday];
#  printf ("Last-Modified: %s, %02d %s %d %02d:%02d:%02d GMT\n", $wday,$mday,$mon,$year,$hour,$mon,$sec);

  # ETag
#  my @file_tag = (stat "$path")[1,9];  # value from inode and lastmodify
#  print "ETag: \"$file_tag[0]-$file_tag[1]\"\n";

  print "\n";
  open(MEDIA, $path) or die("media file open error");
  binmode MEDIA;
  while(<MEDIA>) {
    print $_;
  }
  close MEDIA;

  exit(0);
}
