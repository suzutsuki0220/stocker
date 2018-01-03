#!/usr/bin/perl

use strict;
use warnings;
use utf8;
use Encode;
use CGI;
use MIME::Base64::URLSafe;

## TODO: to get from taginfo
#use MP3::Tag;   # http://search.cpan.org/~ilyaz/MP3-Tag-1.13/lib/MP3/Tag.pm  # MP3::Tag occurs error in Perl 5.26
use Audio::WMA; # http://search.cpan.org/~daniel/Audio-WMA-1.3/WMA.pm
use Audio::FLAC::Header;  # https://metacpan.org/pod/Audio::FLAC::Header
use Audio::Wav;
###

use lib '%libs_dir%';
use ParamPath;
use HTML_Elem;

our $STOCKER_CGI   = "";
our $GET_MEDIA_CGI = "";
our $BASE_DIR_CONF = "";
our $TAGINFO_CGI   = "taginfo";
require '%conf_dir%/music_player.conf';

my $form = eval{new CGI};

my $path;
my $base;
my $base_name = HTML_Elem->url_decode($form->param('dir'));
eval {
  my $ins = ParamPath->new(base_dir_conf => $BASE_DIR_CONF);
  $ins->init_by_base_name($base_name);
  $path = $ins->urlpath_decode($form->param('file'));
  $base = $ins->{base};
};
if ($@) {
  HTML_Elem->header();
  HTML_Elem->error($@);
}

## TODO: delete
$form->param('in') =~ /(.*)\/([^\/]{1,})/;
my $dir_inode = $1;
my $file_inode = $2;

my $encoded_path = $form->param('file');
$encoded_path =~ /(.*)\/([^\/]{1,})$/;

my $player_src = ${GET_MEDIA_CGI}."?dir=".$base_name."&file=".$1;
my $stocker_src = ${STOCKER_CGI}; #."?dir=".$form->param('dir')."&in=".$dir_inode;
###

my $graypad = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAAAwCAIAAAAuKetIAAAAQklEQVRo3u3PAQkAAAgDMLV/mie0hSBsDdZJ6rOp5wQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBATuLGnyAnZizub2AAAAAElFTkSuQmCC";

#### ディレクトリ一覧 ####
$path =~ /(.*)\/([^\/]{1,})$/;
my $media_dir  = $base.$1;
my $media_file = $2;
 
$media_dir =~ /([^\/]{1,})$/;
my $directory_name = $1;
HTML_Elem->header($directory_name);

print <<EOF;
<script type="text/javascript">
<!--
  var track = new Array();
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

    document.coverart.src = track[track_no][7];

    if(!audio_player.error && !audio_player.paused && !audio_player.ended) {
      audio_player.src = "${player_src}/"+ track[track_no][1]+"&type="+play_type;
      audio_player.play();
    } else {
      audio_player.src = "${player_src}/"+ track[track_no][1]+"&type="+play_type;
      audio_player.play();
      document.controller.button_pause.value = "Pause";
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
    document.controller.text_title.value = track[track_no][2];
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

### Audioデーターの一覧
print "<script type=\"text/javascript\">\n";
print "<!--\n";
my $music_count = 0;
opendir(my $DIR, $media_dir) or HTML_Elem->error("ディレクトリ展開に失敗しました");
while (my $entry = decode('utf-8', readdir $DIR)) {
  if (length($entry) > 0 && $entry ne '..'  && $entry ne '.') {
    if ( -f "$media_dir/$entry") {
      my $coverart = &coverart_url($entry);
      my $sub_encoded = ParamPath->urlpath_encode($entry);
      if (lc($entry) =~ /\.mp3$/) {
	  # eval {
	  #  my %tag_t = &get_mp3_info($media_dir ."/". $entry);
	  #  print "  tag = new Array(". $tag_t{"no"} .", \"". ${sub_encoded} ."\", \"". $tag_t{"title"} ."\", \"";
	  #  print $tag_t{"duration"} ."\", \"". $tag_t{"artist"} ."\", \"". $tag_t{"album"} ."\", \"". $tag_t{"year"} ."\", \"${coverart}\");\n";
	  #  print "  track.push(tag);\n";
	  #  $music_count++;
	  # };
      } elsif (lc($entry) =~ /\.wma$/) {
        eval {
            my %tag_t = &get_wma_info($media_dir ."/". $entry);
            print "  tag = new Array(". $tag_t{"no"} .", \"". ${sub_encoded} ."\", \"". $tag_t{"title"} ."\", \"";
	    print $tag_t{"duration"} ."\", \"". $tag_t{"artist"} ."\", \"". $tag_t{"album"} ."\", \"". $tag_t{"year"} ."\", \"${coverart}\");\n";
            print "  track.push(tag);\n";
            $music_count++;
        };
      } elsif (lc($entry) =~ /\.wav$/) {
        eval {
            my %tag_t = &get_wav_info($media_dir ."/". $entry);
            print "  tag = new Array(". $tag_t{"no"} .", \"". ${sub_encoded} ."\", \"". $tag_t{"title"} ."\", \"";
            print $tag_t{"duration"} ."\", \"". $tag_t{"artist"} ."\", \"". $tag_t{"album"} ."\", \"". $tag_t{"year"} ."\", \"${coverart}\");\n";
            print "  track.push(tag);\n";
            $music_count++;
        };
      } elsif (lc($entry) =~ /\.flac$/) {
        eval {
            my %tag_t = &get_flac_info($media_dir ."/". $entry);
            print "  tag = new Array(". $tag_t{"no"} .", \"". ${sub_encoded} ."\", \"". $tag_t{"title"} ."\", \"";
            print $tag_t{"duration"} ."\", \"". $tag_t{"artist"} ."\", \"". $tag_t{"album"} ."\", \"". $tag_t{"year"} ."\", \"${coverart}\");\n";
            print "  track.push(tag);\n";
            $music_count++;
        };
      }
      if ($@) {
          print STDERR "Tag get ERROR: $@\n";
      }
    }
  }
}
print "-->\n";
print "</script>\n";
closedir($DIR);

print "<a href=\"${stocker_src}\">← 戻る</a>\n";
print "<hr>\n";
if ($music_count > 0) {
  print "<h2>${directory_name}</h2>\n";

  print <<DATA;
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

<script type="text/javascript">
<!--
var player_timer = document.getElementById('AudioTimer');

// 再生可能形式チェック
if      (support_mp3 == 'maybe' || support_mp3 == 'probably') { document.controller.type[1].checked = true; }
else if (support_ogg == 'maybe' || support_ogg == 'probably') { document.controller.type[2].checked = true; }
else if (support_wav == 'maybe' || support_wav == 'probably') { document.controller.type[0].checked = true; }

for(i=track.length-1 ; i>0 ; i--) {
  for(j=0 ; j<i ; j++) {
    if(parseInt(track[j][0]) > parseInt(track[j+1][0])) {
      var temp = track[j+1];
      track[j+1] = track[j];
      track[j] = temp;
    }
  }
}

var play_tnum = -1;
document.write("<table border=1>");
document.write("<tr><th>No.</th><th>title</th><th>time</th><th>artist</th><th>album</th><th>year</th></tr>");
for(i=0 ; i<track.length ; i++) {
  var num = i+1;
  document.write("<tr id='track" + i + "'>");
  document.write("<td>"+ num +"</td>");
  document.write("<td><a href=\\"javascript:playit('"+ i +"')\\">"+ track[i][2] +"</a></td>");
  document.write("<td>"+ track[i][3] +"</td>");
  document.write("<td>"+ track[i][4] +"</td>");
  document.write("<td>"+ track[i][5] +"</td>");
  document.write("<td>"+ track[i][6] +"</td>");
  document.write("</tr>");

//  if (track[i][1] == ${file_inode}) {
//    play_tnum = i;
//  }
}
document.write("</table>");

if(play_tnum >= 0) {
  playit(play_tnum);
}

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

-->
</script>
DATA
} else {
  print "音楽ファイルが見つかりません。";
}

HTML_Elem->tail();

exit(0);

####

sub coverart_url
{
  my (${entry}) = @_;

  $path =~ /(.*)\/([^\/]{1,})$/;
  my $encoded_path = ParamPath->urlpath_encode(encode('utf-8', $1 . "/". $entry));
  chomp($encoded_path);

  my $url = $TAGINFO_CGI . "?mode=picture&dir=${base_name}&file=${encoded_path}";

  return $url;
}

=pod
sub get_mp3_info
{
  my ($media_file) = @_;
  my %tag_t;

  # Get tag data from mp3 file
  my $mp3 = MP3::Tag->new($media_file);
  #$mp3->get_tags;
  $tag_t{'duration'} = HTML_Elem->escape_html($mp3->time_mm_ss());
  if( $tag_t{'duration'} eq '00:00' ) {
    $tag_t{'duration'} = "--:--";
  }
  my $track_num = 1;
  my $disc_num  = 1;
  $track_num       = HTML_Elem->escape_html($mp3->track1);
  $disc_num        = HTML_Elem->escape_html($mp3->disk1);
  $tag_t{'title'}  = HTML_Elem->escape_html(encode('utf-8', $mp3->title));
  $tag_t{'artist'} = HTML_Elem->escape_html(encode('utf-8', $mp3->artist));
  $tag_t{'album'}  = HTML_Elem->escape_html(encode('utf-8', $mp3->album));
  $tag_t{'year'}   = HTML_Elem->escape_html($mp3->year);
  $mp3->close();

  if(! $tag_t{'title'} || length($tag_t{'title'}) == 0) {
    $media_file =~ /\/([^\/]+)$/;
    $tag_t{'title'} = $1;
  }
  $tag_t{'no'} = sprintf("%d%02d", $disc_num ? $disc_num : 1, $track_num ? $track_num : 1);

  return %tag_t;
}
=cut

sub get_wma_info
{
  my ($media_file) = @_;
  my %tag_t;

  my $wma = Audio::WMA->new($media_file);
  $wma->setConvertTagsToUTF8(1);
  my $wma_info = $wma->info();
  my $wma_tags = $wma->tags();
  my $playtime = int($wma_info->{'playtime_seconds'});
  my $playsec  = $playtime % 60;
  my $playmin  = ($playtime - $playsec) / 60;
  $tag_t{'duration'} = sprintf("%02d:%02d", $playmin, $playsec);
  my $track_num = 1;
  my $disc_num  = 1;
  $track_num       = HTML_Elem->escape_html($wma_tags->{'TRACK'});
  $tag_t{'title'}  = HTML_Elem->escape_html(encode('utf-8', $wma_tags->{'TITLE'}));
  $tag_t{'artist'} = HTML_Elem->escape_html(encode('utf-8', $wma_tags->{'AUTHOR'}));
  $tag_t{'album'}  = HTML_Elem->escape_html(encode('utf-8', $wma_tags->{'ALBUMTITLE'}));
  $tag_t{'year'}   = HTML_Elem->escape_html($wma_tags->{'YEAR'});

  # if tag's information is invalid
#  $tag_t{'no'} =~ s/[^0-9]//g;
  if(! $tag_t{'title'} || length($tag_t{'title'}) == 0) {
    $media_file =~ /\/([^\/]+)$/;
    $tag_t{'title'} = $1;
  }
  $tag_t{'no'} = sprintf("%d%02d", $disc_num ? $disc_num : 1, $track_num ? $track_num : 1);

  return %tag_t;
}

sub get_wav_info
{
  my ($media_file) = @_;
  my %tag_t;

  my $wav = Audio::Wav->read($media_file);
  my $details = $wav->details();
  my $playtime = int($wav->length_seconds());
  my $playsec  = $playtime % 60;
  my $playmin  = ($playtime - $playsec) / 60;
  $tag_t{'duration'} = sprintf("%02d:%02d", $playmin, $playsec);
  my $track_num = 1;
  my $disc_num  = 1;
#  $tag_t{'no'}     = HTML_Elem->escape_html($wma_tags->{'TRACK'});
#  $tag_t{'title'}  = HTML_Elem->escape_html(encode('utf-8', $wma_tags->{'TITLE'}));
#  $tag_t{'artist'} = HTML_Elem->escape_html(encode('utf-8', $wma_tags->{'AUTHOR'}));
#  $tag_t{'album'}  = HTML_Elem->escape_html(encode('utf-8', $wma_tags->{'ALBUMTITLE'}));
#  $tag_t{'year'}   = HTML_Elem->escape_html($wma_tags->{'YEAR'});

  # if tag's information is invalid
#  $tag_t{'no'} =~ s/[^0-9]//g;
  if(! $tag_t{'title'} || length($tag_t{'title'}) == 0) {
    $media_file =~ /\/([^\/]+)$/;
    $tag_t{'title'} = $1;
  }
  $tag_t{'no'} = sprintf("%d%02d", $disc_num ? $disc_num : 1, $track_num ? $track_num : 1);

  return %tag_t;
}

sub get_flac_info
{
  my ($media_file) = @_;
  my %tag_t;

  my $flac = Audio::FLAC::Header->new($media_file);
  my $info = $flac->info();
  my $tags = $flac->tags();
  my $playtime = int($info->{'TOTALSAMPLES'}/$info->{'SAMPLERATE'});
  my $playsec  = $playtime % 60;
  my $playmin  = ($playtime - $playsec) / 60;
  $tag_t{'duration'} = sprintf("%02d:%02d", $playmin, $playsec);
  my $track_num = 1;
  my $disk_num  = 1;
  foreach my $key (keys %$tags) {
    if (lc($key) eq "tracknumber") {
      $track_num       = HTML_Elem->escape_html($tags->{$key});
    } elsif (lc($key) eq "discnumber") {
      $disk_num        = HTML_Elem->escape_html($tags->{$key});
    } elsif (lc($key) eq "title") {
      $tag_t{'title'}  = HTML_Elem->escape_html($tags->{$key});
    } elsif (lc($key) eq "artist") {
      $tag_t{'artist'} = HTML_Elem->escape_html($tags->{$key});
    } elsif (lc($key) eq "album") {
      $tag_t{'album'}  = HTML_Elem->escape_html($tags->{$key});
    } elsif (lc($key) eq "date") {
      $tag_t{'year'}   = HTML_Elem->escape_html($tags->{$key});
    }
  }

  if(! $tag_t{'title'} || length($tag_t{'title'}) == 0) {
    $media_file =~ /\/([^\/]+)$/;
    $tag_t{'title'} = $1;
  }
  $tag_t{'no'} = sprintf("%d%02d", $disk_num ? $disk_num : 1, $track_num ? $track_num : 1);

  return %tag_t;
}
