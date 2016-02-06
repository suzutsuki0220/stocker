#!/usr/bin/perl

use strict;
use warnings;
use utf8;
use CGI;

use GPS_KML;
use GPS_GPX;
use GPS_NMEA;

use HTML_Elem;
use ParamPath;

our @BASE_DIRS;
require '%conf_dir%/BaseDirs.pl';

our $GOOGLE_API_KEY;
require '%conf_dir%/GPS_viewer.conf';

my $script_name = $ENV{'SCRIPT_NAME'};
my $form = eval{new CGI};

my $base = "";
foreach my $cnf (@BASE_DIRS) {
  if($form->param('dir') eq @{$cnf}[1]) {
    $base = @{$cnf}[2];
    if ($base !~ /\/$/) {
      $base .= "/";
    }
    last;
  }
}
if (length(${base}) == 0 || ! -d "${base}") {
  HTML_Elem->header();
  HTML_Elem->error("設定されているディレクトリが存在しません - ${base}");
}

my $path;
eval {
  $path = ParamPath->inode_to_path($base, $form->param('in'));
};
if ($@) {
  HTML_Elem->header();
  HTML_Elem->error($@);
}

if (length($path) == 0 || ! -e "${base}${path}") {
  HTML_Elem->header();
  HTML_Elem->error("GPSログが見つかりません");
}

my $file_name = $path;
$file_name =~ /([^\/]{1,})$/;
$file_name = $1;

print "Content-Type: text/html\n\n";

if(HTML_Elem->isSP()) {
  # スマホ向けのHTMLヘッダ
  print <<EOF;
<!DOCTYPE html>
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
<meta name="viewport" content="width=660;">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black">
<meta name="apple-touch-fullscreen" content="YES">
<meta http-equiv="Content-Script-Type" content="text/javascript">
<meta http-equiv="Content-Style-Type" content="text/css">
<title>$file_name</title>
EOF
} else {
  # PC向けヘッダ
  print <<EOF;
<!DOCTYPE html>
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
<meta http-equiv="Content-Script-Type" content="text/javascript">
<meta http-equiv="Content-Style-Type" content="text/css">
<title>$file_name</title>
EOF
}


my $start_lat;
my $start_long;
my @coodinates;

eval {
  my $ins;
  if (lc(${path}) =~ /\.nmea$/) {
    $ins = GPS_NMEA->new();
  } elsif (lc(${path}) =~ /\.gpx$/) {
    $ins = GPS_GPX->new();
  } else {
    $ins = GPS_KML->new();
  }
  @coodinates = $ins->read("${base}${path}");
  ($start_lat, $start_long) = $ins->get_start();
};
if ($@) {
  print "</head><body>\n";
  HTML_Elem->error($@);
  exit(0);
}

my $end_lat  = $start_lat;
my $end_long = $start_long;

print <<EOF;
<style type="text/css">
body { margin: 0; line-height: 160%; font-family: arial,sans-serif; }
html, body, #map_canvas { width: 100%; height: 95%; }
</style>

<script src="//maps.google.com/maps/api/js?v=3&key=${GOOGLE_API_KEY}&sensor=false" type="text/javascript" charset="UTF-8"></script>
<script type="text/javascript">
<!--
function map_init() {
  var canter = new google.maps.LatLng($start_lat, $start_long);
  var mapOptions = {
    zoom: 15,
    center: canter,
    mapTypeId: google.maps.MapTypeId.ROADMAP
  };
  var map = new google.maps.Map(document.getElementById('map_canvas'), mapOptions);
  
  var route = [
EOF

  # output coordinates
  foreach my $point (@coodinates) {
    #$point =~ s/^ *(.*?) *$/$1/;
    $point =~ s/[^0-9,\.]//g;
    if (length($point) == 0) {
      next;
    }
    my ($longitude, $latitude, $altitude) = split(/,/, $point);
    print "    new google.maps.LatLng($latitude, $longitude),\n";
    $end_long = $longitude;
    $end_lat  = $latitude;
  }

print <<EOF;
  ];

  var StartMarkerOptions = {
    position: new google.maps.LatLng($start_lat, $start_long),
    map: map,
    title: "Start Point"
  };
  var startMM = new google.maps.Marker(StartMarkerOptions);

  var EndPointOptions = {
    position: new google.maps.LatLng($end_lat, $end_long),
    map: map,
    title: "End Point"
  };
  var endMM = new google.maps.Marker(EndPointOptions);

  var polyOptions = {
    path: route,
    strokeColor: "#0000ff",
    strokeOpacity: 0.5,
    strokeWeight: 5
  }
  var poly = new google.maps.Polyline(polyOptions);
  poly.setMap(map);
}
-->
</script>
</head>
<body onload="map_init()">
<b>$file_name</b><br>
<div id="map_canvas"></div>
EOF

HTML_Elem->tail();

exit(0);

