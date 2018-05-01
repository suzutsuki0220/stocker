#!/usr/bin/perl

use strict;
use warnings;
use utf8;
use Encode;
use CGI;

use lib '%libs_dir%';
use HTML_Elem;
use ParamPath;

our $GOOGLE_API_KEY = "";
our $STOCKER_CGI = "";
our $BASE_DIR_CONF = "";
our $GETFILE_CGI = "";
require '%conf_dir%/GPS_viewer.conf';

my $form = eval{new CGI};
my $in_file = scalar($form->param('file'));

my $path;
my $base;
my $base_name = HTML_Elem->url_decode(scalar ($form->param('dir')));
my $encoded_dir = HTML_Elem->url_encode(${base_name});
eval {
  my $ins = ParamPath->new(base_dir_conf => $BASE_DIR_CONF);
  $ins->init_by_base_name($base_name);
  $path = decode('utf-8', $ins->urlpath_decode($in_file));
  $base = $ins->{base};
};
if ($@) {
  HTML_Elem->header();
  HTML_Elem->error($@);
}

my $file_name = $path;
$file_name =~ /([^\/]{1,})$/;
$file_name = $1;

my $up_path = ParamPath->get_up_path($path);
my $back_link = "${STOCKER_CGI}?file=" . ParamPath->urlpath_encode(encode('utf-8', $up_path)) . "&dir=" . $encoded_dir;

eval {
  my @jslist = (
      "%htdocs_root%/ccchart-min.js",
      "%htdocs_root%/ajax_html_request.js",
      "%htdocs_root%/map_main.js",
      "%htdocs_root%/map_distance.js",
      "%htdocs_root%/map_graph.js",
      "%htdocs_root%/GPS_nmea.js",
      "%htdocs_root%/GPS_xml.js",
      "%htdocs_root%/GPS_accel_csv.js",
      "//maps.google.com/maps/api/js?v=3&key=${GOOGLE_API_KEY}",
  );
  my @csslist = (
      "%htdocs_root%/GPS_viewer.css",
  );
  my $html = HTML_Elem->new(
      javascript => \@jslist,
      css => \@csslist
  );
  $html->header();
};
if ($@) {
  HTML_Elem->header();
  HTML_Elem->error($@);
}

my $html = <<EOF;
<body onload="drawMap('${GETFILE_CGI}', '${encoded_dir}', '${in_file}', '${file_name}')">
<div id="top_field">
<span style="float: left">
<b>${file_name}</b><br>
</span>
<span style="float: right">
<form name="f_link" action="#" method="GET">
<input type="button" name="btn_back" onClick="location.href='${back_link}'" value="戻る">
<input type="button" name="btn_graph" onClick="showGraph(position)" value="グラフ">
</form>
</span>
</div>
<div id="map_canvas"></div>
<div id="graph_field">
  <canvas id="graph_accelXY"></canvas>
  <canvas id="graph_accelZ"></canvas>
  <canvas id="graph_gyro"></canvas>
  <canvas id="graph_event"></canvas>
  <canvas id="graph_speed"></canvas>
</div>
<div id="bottom_field">
<div id="panorama_canvas"></div><canvas id="gforce_accelXY"></canvas>
</div>
<div id="info_field">
<form name="f1" action="#" method="GET">
距離: <span id="distance_text">-- km</span>&nbsp;&nbsp;
サンプル数: 有効=<span id="sample_count">0</span>, 無効=<span id="invalid_sample_count">0</span><br>
<ul>
開始位置<br>
<input type="range" name="range_start" min="0" max="1000" value="0" onChange="rangeChanged(this)" style="width: 97%" list="tickmarks">
<li>時刻: <span id="start_datetime"></span></li>
<li>住所: <span id="start_address"></span></li>
</ul>
<ul>
終了位置<br>
<input type="range" name="range_end" min="0" max="1000" value="1000" onChange="rangeChanged(this)" style="width: 97%" list="tickmarks">
<li>時刻: <span id="end_datetime"></span></li>
<li>住所: <span id="end_address"></span></li>
</ul>
<datalist id="tickmarks">
  <option value="0" label="0%">
  <option value="500" label="50%">
  <option value="1000" label="100%">
</datalist>
</form>
</div>
EOF

print(encode('utf-8', $html));

HTML_Elem->tail();

exit 0;
