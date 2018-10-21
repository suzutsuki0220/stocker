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
      "%htdocs_root%/fontawesome-all.min.js",
      "%htdocs_root%/ajax_html_request.js",
      "%htdocs_root%/jsvalue.js",
      "%htdocs_root%/map_main.js",
      "%htdocs_root%/map_distance.js",
      "%htdocs_root%/map_latlng.js",
      "%htdocs_root%/map_graph.js",
      "%htdocs_root%/map_graph_behavior.js",
      "%htdocs_root%/map_graph_XYacceleration.js",
      "%htdocs_root%/map_car_marker.js",
      "%htdocs_root%/map_event_marker.js",
      "%htdocs_root%/map_range_slider.js",
      "%htdocs_root%/map_playback_route.js",
      "%htdocs_root%/map_track.js",
      "%htdocs_root%/GPS_common.js",
      "%htdocs_root%/GPS_nmea.js",
      "%htdocs_root%/GPS_xml.js",
      "%htdocs_root%/GPS_accel_csv.js",
      "//maps.google.com/maps/api/js?v=3&key=${GOOGLE_API_KEY}",
  );
  my @csslist = (
      "%htdocs_root%/stocker.css",
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
<script type="text/javascript">
    const START_MARKER_ICON = '%htdocs_root%/start.png';
    const END_MARKER_ICON   = '%htdocs_root%/goal.png';
    const CAR_MARKER_ICON   = '%htdocs_root%/car.png';
    const CAUTION_MARKER_ICON = '%htdocs_root%/caution.png';
    const stroke_color = ["#000000", "#0000ff", "#008c10", "#afaf00", "#ff0030", "#505050"];

    var config = {
      apiKey: {
        googlemap: '${GOOGLE_API_KEY}'
      },
      title: {
        scene: {
          stop:   'stop',
          slight: 'slight',
          error:  'error'
        },
        event: ['Braking', 'Throttle', 'Cornering(left)', 'Cornering(right)']
      }
    };

    document.onmouseup = function() {
        if (map_range_slider) {
            map_range_slider.onMouseUpWork();
        }
    };

    document.onmousemove = function(e) {
        if (map_range_slider) {
            map_range_slider.onMouseMoveWork(e);
        }
    };

    window.onload = function() {
        drawMap('${GETFILE_CGI}', '${encoded_dir}', '${in_file}', '${file_name}');

        map_range_slider.onLoadWork({
            after_changed_func: rangeChanged,
            range_start: document.getElementById('range_start_pos'),
            range_end  : document.getElementById('range_end_pos'),
            base_area  : document.getElementById('range_base_area'),
            playback_pos : document.getElementById('range_playback_pos'),
            mask_before_start: document.getElementById('range_mask_before_start'),
            mask_after_end: document.getElementById('range_mask_after_end'),
            stroke_elem: document.getElementById('range_stroke'),
        });
    }

    function judgePolyLineColor(p) {
      var index = 0;

      if (p.speed > 100) {
        index = 4;
      } else if (p.speed > 80) {
        index = 3;
      } else if (p.speed > 40) {
        index = 2;
      } else if (p.speed > 10) {
        index = 1;
      }

      return stroke_color[index];
    }
</script>
<div id="map_warningText"></div>
<div id="playback_status"></div>
<div id="top_field">
<form name="f2" action="#" method="GET">
<span style="float: left">
<b>${file_name}</b><br>
</span>
<span style="float: right">
<a href="javascript:playbackRoute()"><i class="fas fa-play-circle fa-lg" style="color: #ffffff"></i></a>
<select name="playback_speed" id="playback_speed" size="1">
<option value="1.0" selected>1.0</option>
<option value="1.1">1.1</option>
<option value="1.2">1.2</option>
<option value="1.5">1.5</option>
<option value="2.0">2.0</option>
</select>x
<a href="${back_link}" class="button">戻る</a>
<a href="javascript:showGraph(positions, playback.isPlaying())" class="button">グラフ</a>
</span>
</form>
</div>
<div id="map_canvas"></div>
<div id="graph_field">
  <canvas id="graph_accelXY"></canvas>
  <canvas id="graph_accelZ"></canvas>
  <canvas id="graph_gyro"></canvas>
  <canvas id="graph_behavior"></canvas>
  <canvas id="graph_altitude"></canvas>
  <canvas id="graph_speed"></canvas>
</div>
<div id="range_field">
<svg id="range_base_area" width="100%" height="100%">
    <rect width="100%" height="100%" x="0" y="0" stroke="#1c1c1c" stroke-width="1" fill="none" />
    <line x1="0" y1="50%" x2="100%" y2="50%" stroke="#6c6c6c" stroke-width="1" fill="none" />
    <path id="range_stroke" fill="none" stroke="blue" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
    <rect id="range_mask_before_start" x="0" y="0" width="0" height="100%" fill="black" fill-opacity="0.65" />
    <rect id="range_mask_after_end" x="57" y="0" width="0" height="100%" fill="black" fill-opacity="0.65" />
    <rect id="range_start_pos" x="10" y="0" width="5" height="100%" fill="#6969ff" stroke="#3333ff" stroke-width="1" />
    <rect id="range_end_pos" x="50" y="0" width="5" height="100%" fill="#6969ff" stroke="#3333ff" stroke-width="1" />
    <svg id="range_playback_pos" x="50%" y="1" width="11" height="100%" display="none">
        <line x1="6" y1="0" x2="6" y2="100%" stroke="#aa0000" stroke-width="1" fill="none" />
        <polygon points="0,0 4,0 6,2 8,0 11,0 11,3 6,10 0,3" fill="#ff3300" />
    </svg>
</svg>
</div>
<div id="bottom_field">
<div id="panorama_canvas"></div><canvas id="gforce_accelXY"></canvas>
</div>
<div id="info_field">
<form name="f1" action="#" method="GET">
<div style="margin: 3px 0 3px 0.5em;">
距離: <span id="distance_text">-- km</span>&nbsp;&nbsp;
時間: <span id="duration_text">---- 秒</span>&nbsp;&nbsp;
位置情報: 総数=<span id="sample_count">0</span>, Points=<span id="point_count">0</span>(間引き <span id="skip_sample">0</span>), 無効=<span id="invalid_sample_count">0</span><br>
</div>
<div style="margin: 3px 0 3px 0.5em;">
Track: 
<input type="button" name="track_prev" value="＜" onClick="setTimeRangeByTrack(-1)">
<span id="current_track"></span>
<input type="button" name="track_next" value="＞" onClick="setTimeRangeByTrack(1)">
</div>
<div style="margin-left: 2em;">
開始位置<br>
<i class="far fa-clock"></i> <span id="start_datetime"></span><br>
<i class="fas fa-map-marker-alt"></i> <span id="start_address"></span><br>
</div><br>
<div style="margin-left: 2em;">
終了位置<br>
<i class="far fa-clock"></i> <span id="end_datetime"></span><br>
<i class="fas fa-map-marker-alt"></i> <span id="end_address"></span><br>
</div>
</form>
</div>
EOF

print(encode('utf-8', $html));

HTML_Elem->tail();

exit 0;
