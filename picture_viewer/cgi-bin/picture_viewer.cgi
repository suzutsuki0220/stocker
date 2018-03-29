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
require '%conf_dir%/picture_viewer.conf';

my $script_name = $ENV{'SCRIPT_NAME'};
my $img_idx = 0;
my $img_num = 0;

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
      "%htdocs_root%/stocker.css",
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
<div style="clear: both; position: relative;">
<span id="title_field">
<span id="filename_field">$file_name</span>
</span>
<span id="control_field"></span>
<span class="back_link maruButton">
<a href="${back_link}" style="text-decoration: none;">←</a>
</span>
</div>
EOF

my $has_exif = 0;
my $exif_data;
my $exif_xml;
my $last_mod = substr(localtime((stat("${base}${path}"))[9]), 4);  # cut off weekday
if(0) { #open(IN, "${EXIF_CMD} -x '${base}${path}' 2>/dev/null |")) {
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

  print <<EOF;
<div style="clear: both; position: relative;">
  <img src="${GET_THUMBNAIL_CGI}?file=${encoded_path}&dir=${base_name}" width="100%" name="ImageArea" id="ImageArea">
  <div style="position: absolute; top: 50%; left: 50%; display: none; background-color: white; color: #121212" id="loadingText">
    loading...
  </div>
</div>

<script type="text/javascript">
<!--
    setFileName("${file_name}");
    getImageList("${base_name}", "${encoded_uppath}");
    imageLoading("${encoded_path}");

    function getPictureSrc(path) {
      return "${GET_PICTURE_CGI}?file=" + path + "&dir=${base_name}&size=640";
    }
-->
</script>
EOF

HTML_Elem->tail();
exit(0);

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
