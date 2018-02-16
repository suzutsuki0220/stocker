#!/usr/bin/perl

use strict;
use warnings;
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
      "%htdocs_root%/ajax_html_request.js",
      "%htdocs_root%/map_main.js",
      "%htdocs_root%/map_distance.js",
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

print <<EOF;
<body onload="drawMap('${GETFILE_CGI}', '${encoded_dir}', '${in_file}', '${file_name}')">
<div style="height: 5%">
<span style="float: left">
<b>${file_name}</b><br>
</span>
<span style="float: right">
<a href="${back_link}">戻る</a>
</span>
</div>
<div id="map_canvas"></div>
<div id="panorama_canvas"></div>
<div id="info_field">
距離: <span id="distance_text">-- km</span><br>
サンプル数: 有効=<span id="sample_count">0</span>, 無効=<span id="invalid_sample_count">0</span><br>
開始位置住所: <span id="start_address"></span><br>
終了位置住所: <span id="end_address"></span>
</div>
</body>
</html>
EOF

