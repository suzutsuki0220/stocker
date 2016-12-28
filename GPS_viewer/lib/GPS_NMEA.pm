package GPS_NMEA;

use strict;
use warnings;
#use Data::Dumper;

my @coodinates;
my $gprmc_flag = 0;
my $gpgpa_flag = 0;

sub new {
  my $class = shift;
  my $self = {
    @_,
  };

  return bless $self, $class;
}

sub _get_degree
{
  my ($fraction) = @_;
  $fraction =~ /(\d+)(\d\d\.\d+)/;
  my $d = $1;
  my $m = $2;

  return $d + $m / 60;
}

sub read
{
  my $self = shift;
  my ($path) = @_;
  @coodinates = ();

  $gprmc_flag = 0;
  $gpgpa_flag = 0;

  open(my $fin, "< ${path}");
  while (my $line = <$fin>) {
    if ($gprmc_flag == 1 && $gpgpa_flag == 1) {
      last;
    }
    if ($line =~ /^\$G[PN]GGA/) {
      $gpgpa_flag = 1;
    }
    if ($line =~ /^\$G[PN]RMC/) {
      $gprmc_flag = 1;
    }
  }
  if ($gprmc_flag == 0 && $gpgpa_flag == 0) {
    close($fin);
    die("NMEA has no coodinate");
  }

  seek ($fin, 0, 0);
  while (my $line = <$fin>) {
    if ($gpgpa_flag) {
      if ($line =~ /^\$G[PN]GGA/) {
        my @col = split(/,/, $line);
        if (@col) {
          my $lat = $col[2] ? &_get_degree($col[2]) : 0;
          my $lon = $col[4] ? &_get_degree($col[4]) : 0;
          my $ele = $col[9] ? $col[9] : 0;
          if ($lat > 0 && $lon > 0 && $ele > 0) {
            push(@coodinates, $lon .",". $lat .",". $ele);
          }
        }
      }
    } elsif ($gprmc_flag) {
      if ($line =~ /^\$G[PN]RMC/) {
        my @col = split(/,/, $line);
        if (@col) {
          my $lat = $col[3] ? &_get_degree($col[3]) : 0;
          my $lon = $col[5] ? &_get_degree($col[5]) : 0;
          my $ele = 0;
          if ($lat > 0 && $lon > 0 && $ele > 0) {
            push(@coodinates, $lon .",". $lat .",". $ele);
          }
        }
      }
    }
  }
  close($fin);

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
