#!/usr/bin/perl

use strict;
use warnings;
use utf8;
use Encode;
use CGI;

use lib '%libs_dir%';
use ParamPath;
use HTML_Elem;

our $STOCKER_CGI   = "";
our $GET_MEDIA_CGI = "";
our $BASE_DIR_CONF = "";
our $SUPPORT_TYPES = "";
our $TAGINFO_CGI   = "taginfo";
require '%conf_dir%/music_player.conf';

our @support_audio_types;
require $SUPPORT_TYPES;

my $form = eval{new CGI};

my $base_name = scalar($form->param('dir'));
my $encoded_path = scalar($form->param('file'));
eval {
  my $ins = ParamPath->new(base_dir_conf => $BASE_DIR_CONF);
  $ins->init_by_base_name(HTML_Elem->url_decode($base_name));
};
if ($@) {
  HTML_Elem->header();
  HTML_Elem->error($@);
}

$base_name = HTML_Elem->url_encode(scalar($form->param('dir')));

my $graypad = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAAAwCAIAAAAuKetIAAAAQklEQVRo3u3PAQkAAAgDMLV/mie0hSBsDdZJ6rOp5wQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBATuLGnyAnZizub2AAAAAElFTkSuQmCC";

eval {
  my @jslist = (
      "%htdocs_root%/main.js",
      "%htdocs_root%/get_directory_list.js",
      "%htdocs_root%/music_player.js",
  );
  my $html = HTML_Elem->new(
      javascript => \@jslist
  );
  $html->header();
};
if ($@) {
  HTML_Elem->header();
  HTML_Elem->error($@);
}

my $music_pattern = makePatternString(\@support_audio_types);

print <<EOF;
<script type="text/javascript">
<!--
  var audio_player = new Audio();

  var support_mp3 = audio_player.canPlayType("audio/mp3");
  var support_ogg = audio_player.canPlayType("audio/ogg");
  var support_wav = audio_player.canPlayType("audio/wav");

  function get_atype_checked() {
    var i=0;
    for (i=0;i<3;i++) {
      if (document.controller.type[i].checked == true) {
        return document.controller.type[i].value;
      }
    }
  }

  function playit(track_no) {
    var play_type = get_atype_checked();
    if (play_type == undefined) {
      if (support_mp3 == 'maybe' || support_mp3 == 'probably' ) { play_type="mp3"; }
      else if (support_ogg == 'maybe' || support_ogg == 'probably') { play_type="ogg"; }
      else if (support_wav == 'maybe' || support_wav == 'probably') { play_type="wav"; }
    }

    document.coverart.src = "${TAGINFO_CGI}?mode=picture&dir=" + track[track_no].base_name + "&file=" + track[track_no].path;
    audio_player.src = "${GET_MEDIA_CGI}?dir=" + track[track_no].base_name + "&file=" +track[track_no].path + "&type=" + play_type;
    audio_player.play();
    document.controller.button_pause.value = "Pause";

    if(audio_player.error || audio_player.paused || audio_player.ended) {
/* ended event is not work correctly in iOS */
/*
      audio_player.addEventListener('ended',   function() {
        //var audio_player = document.getElementById("player");
        audio_player.removeEventListener('ended', arguments.callee, false);
        if(document.controller.text_trnum.value < track.length) {
          playit(document.controller.text_trnum.value);
        } else {
          fill_color(-1);
          document.controller.button_pause.value = "Play";
          document.getElementById('AudioTimer').innerHTML = '00:00';
          document.controller.text_trnum.value = "";
          document.controller.text_title.value = "";
          alert("全てのトラックを再生しました。");
        }
      }, true);
*/
    }
    fill_color(track_no);
    document.controller.text_trnum.value = parseInt(track_no) + 1;
    document.controller.text_title.value = track[track_no].title;
    audio_player.addEventListener('timeupdate', function() {
      audio_player.removeEventListener('timeupdate', arguments.callee, false);
      var sec = '0' + Math.floor(audio_player.currentTime % 60);
      var min = '0' + Math.floor(audio_player.currentTime / 60);
      sec = sec.substr(sec.length-2, 2);
      min = min.substr(min.length-2, 2);
      player_timer.innerHTML = min +':'+ sec;
      if(audio_player.ended) {
        if(document.controller.text_trnum.value < track.length) {
          playit(document.controller.text_trnum.value);
        } else {
          fill_color(-1);
          document.controller.button_pause.value = "Play";
          document.getElementById('AudioTimer').innerHTML = '00:00';
          document.controller.text_trnum.value = "";
          document.controller.text_title.value = "";
          alert("全てのトラックを再生しました。");
        }
      }
    }, true);
  }

  function play_pause() {
    //var audio_player = document.getElementById("player");
    if( !audio_player.error && !audio_player.paused && !audio_player.ended ) {
      audio_player.pause();
      document.controller.button_pause.value = "Play";
    } else {
      if( document.controller.text_trnum.value <= 0 || document.controller.text_trnum.value > track.length) {
        playit(0);
        return;
      }
      audio_player.play();
      document.controller.button_pause.value = "Pause";
    }
  }

  function fill_color(track_no) {
    var i=0;
    for(i=0 ; i<track.length ; i++) {
      var elem1 = document.getElementById('track' + i);
      elem1.style.color = "#000000";
      elem1.style.backgroundColor = "#ffffff";
    }
    if( track_no == NaN || track_no < 0 || track_no > track.length) {
      return;
    }

    var elem2 = document.getElementById('track' + track_no);
    elem2.style.color = "#ffffff";
    elem2.style.backgroundColor = "#66cc66";
  }
-->
</script>
EOF

print <<DATA;
<a href="#" id="back_link">← 戻る</a>
<hr>
<h2 id="directory_name_area"></h2>
<p>
<img src="${graypad}" name="coverart" width="120" height="120">
<!-- <audio src="" id="player" autobuffer>
お使いの環境では、プレイヤーを起動できません。
</audio><br> -->
<form name="controller" action="#" method="post">
<input type="button" name="button_pause" value="Play" onClick="play_pause()">
<input type="text" name="text_trnum" value="" size=2  readonly>
<input type="text" name="text_title" value="" size=40 readonly>
Time: <span id="AudioTimer">00:00</span><br>
Type: <input type="radio" name="type" value="wav">wav <input type="radio" name="type" value="mp3">mp3 <input type="radio" name="type" value="ogg">ogg
</form>
</p>

<div id="music_list">音楽ファイルが見つかりません。</div>

<script type="text/javascript">
<!--
var player_timer = document.getElementById('AudioTimer');

// 再生可能形式チェック
if      (support_mp3 == 'maybe' || support_mp3 == 'probably') { document.controller.type[1].checked = true; }
else if (support_ogg == 'maybe' || support_ogg == 'probably') { document.controller.type[2].checked = true; }
else if (support_wav == 'maybe' || support_wav == 'probably') { document.controller.type[0].checked = true; }

// CoverArt
if (document.coverart.addEventListener) {
  document.coverart.addEventListener("error", errorCoverart, false);
  document.coverart.addEventListener("abort", errorCoverart, false);
} else if (document.coverart.attachEvent) {  // for InternetExplorer
  document.coverart.attachEvent("onerror", errorCoverart);
  document.coverart.attachEvent("onabort", errorCoverart);
}

function errorCoverart() {
  document.coverart.src = "${graypad}";
}

const STOCKER_CGI = "${STOCKER_CGI}";
const TAGINFO_CGI = "${TAGINFO_CGI}";
const base_name = "${base_name}";
const music_pattern = /\\.(${music_pattern})\$/;  // 拡張子判定
getDirectoryList("${base_name}", "${encoded_path}", 0, 0, musicList);
-->
</script>
DATA

HTML_Elem->tail();

exit(0);

#####

sub makePatternString
{
  my ($array_ref) = @_;
  my $ret = "";

  foreach my $type (@$array_ref) {
    if (length($ret) != 0) {
      $ret .= "|";
    }
    $ret .= $type;
  }

  return $ret;
}
