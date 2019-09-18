package GPS_KML;

use strict;
use warnings;
use XML::Simple;
use Archive::Zip;
#use Data::Dumper;

my @coodinates;
my $TMP_FILE = "/tmp/__GPS_KML_tmp_" . time . rand();

sub new {
  my $class = shift;
  my $self = {
    @_,
  };

  return bless $self, $class;
}

sub read
{
  my $self = shift;
  my ($path) = @_;
  my $xml = XML::Simple->new(KeepRoot=>1, ForceArray=>1);
  my $gps_data;
  if (lc(${path}) =~ /\.kmz$/) {
    my $zip = Archive::Zip->new("${path}");
    foreach ($zip->memberNames()) {
      if ($_ eq "doc.kml") {
        $zip->extractMember($_, ${TMP_FILE});
        last;
      }
    }
    if (! -f ${TMP_FILE}) {
      foreach ($zip->memberNames()) {
        if (lc($_) =~ /\.kml$/) {
          $zip->extractMember($_, ${TMP_FILE});
          last;
        }
      }
    }
    if (! -f ${TMP_FILE}) {
      die("kmz read error: kml file found");
    }
    $gps_data = $xml->XMLin("${TMP_FILE}");
    unlink(${TMP_FILE});
  } else {
    $gps_data = $xml->XMLin("${path}");
  }
  #print Dumper($gps_data); #debug

  my $elem;
  if (
    !($elem = $gps_data->{'kml'}[0]->{'Folder'}[0]->{'Placemark'}) &&
    !($elem = $gps_data->{'kml'}[0]->{'Document'}[0]->{'Folder'}[0]->{'Placemark'})
  ) {
    die("kml parse error: Placemark not found");
  }

  while (my($key, $folder) = each ($elem)) {
    if (&parse_placemark($folder) == 0) {
      last;
    }
  }
  return @coodinates;
}

sub parse_placemark
{
  my ($tags) = @_;
  my $ret = -1;

  while (my($key, $folder) = each $tags) {
    if ($key eq 'LineString') {
      while (my ($subkey, $subfolder) = each $folder->[0]) {
        if ($subkey eq 'coordinates') {
         # print "SUB folder: " . $subfolder->[0] . "<br>\n";
          @coodinates = split(/\n/, $subfolder->[0]);
          $ret = 0;
        }
      }
    }
  }

  return $ret;
}

sub get_start
{
  my $self = shift;

  my $longitude;
  my $latitude;
  my $altitude;

  foreach my $point (@coodinates) {
    #$point =~ s/^ *(.*?) *$/$1/;
    $point =~ s/[^0-9,\.]//g;
    if (length($point) == 0) {
      next;
    }
    ($longitude, $latitude, $altitude) = split(/,/, $point);
    last;
  }

  my @start_point = ($latitude, $longitude);
  return @start_point;
}


1; # __EXIT__
