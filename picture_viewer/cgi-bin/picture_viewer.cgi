#!/usr/bin/perl

use strict;
use warnings;
use utf8;
use Encode;
use CGI;

use lib '%libs_dir%';
use ParamPath;
use HTML_Elem;

our $BASE_DIR_CONF = "";
our $GET_PICTURE_CGI = "";
our $GET_THUMBNAIL_CGI = "";
our $EXIF_INFO_CGI = "";
our $STOCKER_CGI = "";
our $SUPPORT_TYPES = "";
require '%conf_dir%/picture_viewer.conf';

our @support_image_types;
require $SUPPORT_TYPES;

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
      "%htdocs_root%/bundle.js",
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

my $photo_pattern = makePatternString(\@support_image_types);

print <<EOF;
<div id="image_list"></div>
<div style="clear: both; position: relative;">
<span id="title_field">
<span id="filename_field">$file_name</span>
</span>
<span id="control_field"></span>
<span class="BackLink maruButton">
<a href="${back_link}" style="text-decoration: none;">←</a>
</span>
</div>

<div id="ContentArea">
  <div id="ExifLayer" style="display: none"></div>
  <div id="loadingText">loading...</div>
  <span class="InfoLinkArea maruButton"><a href="javascript:toggleExifLayer('${EXIF_INFO_CGI}', '${encoded_dir}', '${encoded_path}')" id="InfoLink">i</a></span>
  <img src="${GET_THUMBNAIL_CGI}?file=${encoded_path}&dir=${encoded_dir}" width="100%" name="ImageArea" id="ImageArea">
</div>

<script type="text/javascript">
<!--
    const image_pattern = /\\.(${photo_pattern})\$/;  // 拡張子判定

    document.title = "${file_name}";
    setFileName("${file_name}");
    getImageList("${encoded_dir}", "${encoded_uppath}");
    imageLoading("${encoded_path}");

    function getPictureSrc(path) {
        return "${GET_PICTURE_CGI}?file=" + path + "&dir=${encoded_dir}&size=640";
    }

    function getExifInfoHref(path) {
        return "javascript:toggleExifLayer('${EXIF_INFO_CGI}', '${encoded_dir}', '" + path + "')";
    }
-->
</script>
EOF

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
