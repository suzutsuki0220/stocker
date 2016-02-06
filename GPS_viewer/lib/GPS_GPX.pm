package GPS_GPX;

use strict;
use warnings;
use XML::Simple;
#use Data::Dumper;

my @coodinates;

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
  $gps_data = $xml->XMLin("${path}");
#  print Dumper($gps_data); #debug
  @coodinates = ();

  my $elem;
  if (
    !($elem = $gps_data->{'gpx'}[0]->{'trk'}[0]->{'trkseg'}[0]->{'trkpt'})
  ) {
    die("gpx parse error: Placemark not found");
  }

  foreach my $e (@$elem) {
    push(@coodinates, $e->{'lon'} .",". $e->{'lat'} .",". $e->{'ele'}[0]);
  }

  return @coodinates;
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
