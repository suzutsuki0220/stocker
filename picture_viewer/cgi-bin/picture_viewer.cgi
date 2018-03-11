#!/usr/bin/perl

use strict;
use warnings;
use utf8;
use Encode;
use CGI;

use XML::Simple;

use lib '%libs_dir%';
use ParamPath;
use HTML_Elem;

our $BASE_DIR_CONF = "";
our $GET_PICTURE_CGI = "";
our $GET_THUMBNAIL_CGI = "";
our $STOCKER_CGI = "";
our $EXIF_CMD = "";
require '%conf_dir%/picture_viewer.conf';

my $script_name = $ENV{'SCRIPT_NAME'};
my $img_idx = 0;
my $img_num = 0;
my $link_next = "";
my $link_prev = "";
my $link_dir = "";

my $form = eval{new CGI};
my $in_dir = $form->param('dir');
my $in_in  = $form->param('in');

my $base;
my $path;
my $base_name = scalar($form->param('dir'));
my $encoded_path = scalar($form->param('file'));
eval {
  my $ins = ParamPath->new(base_dir_conf => $BASE_DIR_CONF);
  $ins->init_by_base_name(HTML_Elem->url_decode($base_name));
  $path = decode('utf-8', $ins->urlpath_decode($encoded_path));
  $base = $ins->{base};
};
if ($@) {
  HTML_Elem->header();
  HTML_Elem->error($@);
}

my $encoded_dir = HTML_Elem->url_encode(${base_name});
my $up_path = ParamPath->get_up_path($path);
my $encoded_uppath = ParamPath->urlpath_encode(encode('utf-8', $up_path));
my $back_link = "${STOCKER_CGI}?file=${encoded_uppath}&dir=${encoded_dir}";

my $file_name = ParamPath->get_filename($path);

eval {
  my @jslist = (
      "%htdocs_root%/ajax_html_request.js",
      "%htdocs_root%/get_directory_list.js",
      "%htdocs_root%/picture_viewer.js",
  );
  my @csslist = (
      "%htdocs_root%/picture_viewer.css",
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
<div id="image_list"></div>
<div style="clear: both;">
<span id="title_field">
<a href="${back_link}">← 戻る</a>&nbsp;&nbsp;
<span id="filename_field">$file_name</span>
</span>
<span id="control_field"></span>
</div>
EOF

my $has_exif = 0;
my $exif_data;
my $exif_xml;
my $last_mod = substr(localtime((stat("${base}${path}"))[9]), 4);  # cut off weekday
if(open(IN, "${EXIF_CMD} -x '${base}${path}' 2>/dev/null |")) {
  while (<IN>) {
    $exif_xml .= $_;
  }
  close(IN);
}
if(length($exif_xml) > 0) {
  my $xml = XML::Simple->new(KeepRoot=>1, ForceArray=>1);
  $exif_data = $xml->XMLin($exif_xml);
  if ($exif_data) {
    $has_exif = 1;
  }
}

print "<div style=\"clear: both;\">\n";
if ($has_exif == 1) {
  #my $pic_width  = $exif_data->{'exif'}[0]->{'Pixel_X_Dimension'}[0];
  #my $pic_height = $exif_data->{'exif'}[0]->{'Pixel_Y_Dimension'}[0];

  print "<img src=\"${GET_THUMBNAIL_CGI}?file=${encoded_path}&dir=${base_name}\" width=\"100%\" id=\"ImageArea\" onload=\"get_high_img(\'${GET_PICTURE_CGI}?file=${encoded_path}&dir=${base_name}&size=640\')\">\n";
} else {
  print "<img src=\"${GET_PICTURE_CGI}?file=${encoded_path}&dir=${base_name}&size=640\" width=\"100%\" id=\"ImageArea\">\n";
}
print "</div>\n";

print <<EOF;
<script type="text/javascript">
<!--
    setFileName("${file_name}");
    getImageList("${base_name}", "${encoded_uppath}");

    function getPictureSrc(path) {
      return "${GET_PICTURE_CGI}?file=" + path + "&dir=${base_name}&size=640";
    }
-->
</script>
EOF

HTML_Elem->tail();
exit(0);

print <<EOF;
<script type="text/javascript">
<!--
document.getElementById('ImageArea').addEventListener("touchstart", touchStart, false);
document.getElementById('ImageArea').addEventListener("touchmove", touchMove, false);
document.getElementById('ImageArea').addEventListener("touchend", touchEnd, false);

function StartPoint(X,Y) {
  this.X = 0;
  this.Y = 0;
}

function EndPoint(X,Y) {
  this.X = 0;
  this.Y = 0;
}

function touchStart(e) {
  e.preventDefault();
  var t = e.touches[0];
  StartPoint.X = t.pageX;
  StartPoint.Y = t.pageY;
}

function touchMove(e) {
  e.preventDefault();
  var t = e.touches[0];
  EndPoint.X = t.pageX;
  EndPoint.Y = t.pageY;
}

function touchEnd(e) {
  e.preventDefault();

  var cut_off_threshold = 40;

  if( Math.abs(EndPoint.X - StartPoint.X) <= cut_off_threshold ) {
    if( Math.abs(EndPoint.Y - StartPoint.Y) > cut_off_threshold ) {
      if( EndPoint.Y > StartPoint.Y ) {
        scrollBy(0,-100);  /* up */
      } else {
        scrollBy(0,100);  /* down */
      }
    }
  }
  else if( Math.abs(EndPoint.Y - StartPoint.Y) <= cut_off_threshold ) {
    if( Math.abs(EndPoint.X - StartPoint.X) > cut_off_threshold ) {
      if( EndPoint.X > StartPoint.X ) {
        if('$link_prev' != '') document.location = '$script_name?dir=${base_name}&in=$link_prev';  /* left */
      } else {
        if('$link_next' != '') document.location = '$script_name?dir=${base_name}&in=$link_next';  /* right */
      }
    }
  }
//  else {
//    if( EndPoint.X > StartPoint.X && EndPoint.Y > StartPoint.Y ) {
//      /* upleft */
//    } else if( EndPoint.X > StartPoint.X && EndPoint.Y < StartPoint.Y ) {
//      /* downleft */
//    } else if( EndPoint.X < StartPoint.X && EndPoint.Y > StartPoint.Y ) {
//      /* upright */
//    } else if( EndPoint.X < StartPoint.X && EndPoint.Y < StartPoint.Y ) {
//      /* downright */
//    }
//  }

  //alert("X: "+StartPoint.X+"-"+EndPoint.X+"  Y: "+StartPoint.Y+"-"+EndPoint.Y);
  StartPoint.X = 0; StartPoint.Y = 0;
  EndPoint.X = 0; EndPoint.Y = 0;
}
-->
</script>
EOF

#  print "<p>Download: ";
#  print "<a href=\"${GET_PICTURE_CGI}?in=$in_in&dir=$in_dir\" target=\"_blank\">Orignal</a>&nbsp;&nbsp;";
#  print "<a href=\"${GET_PICTURE_CGI}?in=$in_in&dir=$in_dir&size=1920\" target=\"_blank\">L</a>&nbsp;&nbsp;";
#  print "<a href=\"${GET_PICTURE_CGI}?in=$in_in&dir=$in_dir&size=800\" target=\"_blank\">M</a>&nbsp;&nbsp;";
#  print "<a href=\"${GET_PICTURE_CGI}?in=$in_in&dir=$in_dir&size=640\" target=\"_blank\">S</a><br><br>";
  my $file_size = (-s "${base}${path}");
  1 while $file_size =~ s/(\d)(\d\d\d)(?!\d)/$1,$2/g;  # This code from "http://perldoc.perl.org/perlop.html"
  print "サイズ: ". $file_size ." Byte<br>";
  print "更新日時: ". $last_mod;
  print "</p>\n";

if($has_exif == 1) {
  print "<h3>EXIF情報</h3>\n";
  print "<table border=\"1\">\n";
  print "<tr><th>EXIFバージョン</th><td>$exif_data->{'exif'}[0]->{'Exif_Version'}[0]</td></tr>\n";
  print "<tr><th>幅 x 高さ</th><td>$exif_data->{'exif'}[0]->{'Pixel_X_Dimension'}[0] x $exif_data->{'exif'}[0]->{'Pixel_Y_Dimension'}[0]</td></tr>\n";
  print "<tr><th>作成日時</th><td>$exif_data->{'exif'}[0]->{'Date_and_Time__Original_'}[0]</td></tr>\n";
  print "<tr><th>メーカー</th><td>$exif_data->{'exif'}[0]->{'Manufacturer'}[0]</td></tr>\n";
  print "<tr><th>モデル</th><td>$exif_data->{'exif'}[0]->{'Model'}[0]</td></tr>\n";
  print "<tr><th>絞り値</th><td>$exif_data->{'exif'}[0]->{'F-Number'}[0]</td></tr>\n";
  print "<tr><th>露出時間</th><td>$exif_data->{'exif'}[0]->{'Exposure_Time'}[0]</td></tr>\n";
  print "<tr><th>ISO感度</th><td>$exif_data->{'exif'}[0]->{'ISO_Speed_Ratings'}[0]</td></tr>\n";
  print "<tr><th>露出補正</th><td>$exif_data->{'exif'}[0]->{'Exposure_Bias'}[0]</td></tr>\n";
  print "<tr><th>焦点距離</th><td>$exif_data->{'exif'}[0]->{'Focal_Length'}[0]</td></tr>\n";
  print "</table>\n";
}

HTML_Elem->tail();
exit(0);

#####

sub show_dir_imglist {  # TODO: remove
  my ($path, $repeat) = @_;  # (対象ディレクトリ, 画像表示枚数)
  ### ディレクトリ内の写真
  my $path_of_dir = ParamPath->get_up_path($path);
  my $path_of_inode = ParamPath->get_up_path($in_in);
  if (opendir(my $dir, "$path_of_dir")) {
    my @jpg_list = ();
    while (my $entry = decode('utf-8', readdir $dir)) {
      if (length($entry) >= 0) {
        if (lc($entry) =~ /\.jpg$/ || lc($entry) =~ /\.jpeg$/) {
          push(@jpg_list, $entry);
        }
      }
    }
    closedir($dir);
    @jpg_list = sort {$a cmp $b} @jpg_list;
    print "<p>\n";
    my $img_idx = 0;
    my $img_pointer = 0;
    foreach my $entry (@jpg_list) {
      if("$path_of_dir/$entry" eq "$path") {
        $img_pointer = $img_idx;
        last;
      }
      $img_idx++;
    }
    if($img_idx < ($repeat-1)/2) { $img_idx = ($repeat-1)/2; }
    my $idx = 0;
    foreach my $entry (@jpg_list) {
      if($idx >= $img_idx-($repeat-1)/2 && $img_idx+($repeat-1)/2 >= $idx) {
        my $fname = HTML_Elem->escape_html($entry);
        print "<a href=\"${script_name}?in=$path_of_inode/".(stat "$path_of_dir/$entry")[1]."&dir=$in_dir\" alt=\"$fname\">";
        print "<img src=\"${GET_THUMBNAIL_CGI}?in=$path_of_inode/".(stat "$path_of_dir/$entry")[1]."&dir=$in_dir\" ";
        print "style=\"border: solid #0000ff;\" " if ($img_pointer == $idx);
        print "width=\"70\">";
        print "</a>";
      }
      $idx++;
    }
    print "</p>\n";
  }
}
