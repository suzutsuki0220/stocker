#!/usr/bin/perl

use strict;
use warnings;
use utf8;
use Encode;
use CGI;
use File::Path;

use ParamPath;
use HTML_Elem;
use ConverterJob;
use FileTypes;

our $STOCKER_CGI    = "";
our $BASE_DIR_CONF  = "";
our $SUPPORT_TYPES  = "";
our $ENCBATCH_LIST  = "";
our $HTDOCS_ROOT    = "";
require $ENV{'STOCKER_CONF'} . '/stocker.conf';
require $ENV{'STOCKER_CONF'} . '/converter.conf';

our @support_video_types;
our @support_audio_types;
require $SUPPORT_TYPES;

my $q = eval{new CGI};
my $dir  = HTML_Elem->url_decode(scalar($q->param('root')));
my $out_root = HTML_Elem->url_decode(scalar($q->param('out_root')));
my $out_path = scalar($q->param('out_path'));
my @files = $q->multi_param('path');

my $encoded_path = $files[0];
my $path;
my $base;
eval {
  my $ins = ParamPath->new(base_dir_conf => $BASE_DIR_CONF);
  $ins->init_by_base_name($dir);
  $path =decode('utf-8', $ins->urlpath_decode($encoded_path));
  $base = $ins->{base};
};
if ($@) {
  HTML_Elem->header();
  HTML_Elem->error($@);
}

my $encoded_out_root;
my $encoded_out_path;
eval {
  my $ins = ParamPath->new(base_dir_conf => $BASE_DIR_CONF);
  $ins->init_by_base_name($out_root);
  $encoded_out_path = decode('utf-8', $ins->urlpath_decode($out_path));
  $encoded_out_root = $ins->{base};
};
if ($@) {
  HTML_Elem->header();
  HTML_Elem->error($@);
}

$dir = HTML_Elem->url_encode($dir);

if (@files.length == 0) {
  HTML_Elem->header();
  HTML_Elem->error("ファイルが選択されていません");
}

for (my $i=0; $i<@files.length; $i++) {
  $files[$i] = decode('utf-8', ParamPath->urlpath_decode($files[$i]));
}
@files = sort {$a cmp $b} @files;

my $encfile = $base . decode('utf-8', ParamPath->urlpath_decode($encoded_path));

my $mtype = &check_capable_type($encfile);
if ($mtype eq "unsupported") {
  HTML_Elem->header();
  HTML_Elem->error("対応していない形式です: " . encode('utf-8', $encfile));
}

eval {
  &perform_encode();
};
if ($@) {
  HTML_Elem->header();
  HTML_Elem->error("登録に失敗しました: " . encode('utf-8', $@));
}

exit(0);

#############################

sub getBoolean() {
  my ($param) = @_;
  return $param ? $param : 'false';
}

### エンコード
sub perform_encode() {
  if ($q->param('multi_editmode') eq "sameenc") {
    foreach (@files) {
      &add_encodejob("${base}" . $_);
    }
  } elsif ($q->param('multi_editmode') eq "combine") {
    my $concat = "concat:";
    foreach (@files) {
      $concat .= "${base}" . $_ . "|";
    }
    &add_encodejob("$concat");
  } else {
    &add_encodejob("${base}${path}");
  }

  HTML_Elem->header();
  print "エンコードキューに入れました";
  HTML_Elem->tail();
}

sub add_encodejob()
{
  my ($source) = @_;

  my $job = ConverterJob->new(listfile => $ENCBATCH_LIST);
  $job->{source} = $source;
  $job->{out_dir} = $encoded_out_root . $encoded_out_path;
  $job->{format} = $q->param('format');
  if (&getBoolean($q->param('set_position')) eq 'true') {
    $job->{set_position} = 'true';
    my @ss_list = ();
    my @t_list = ();
    my $i = 0;
    while ($q->param('ss'.$i)) {
      push(@ss_list, $q->param('ss'.$i));
      push(@t_list, $q->param('t'.$i) ? $q->param('t'.$i) : 0);
      $i++;
    }
    $job->{ss} = \@ss_list;
    $job->{t}  = \@t_list;
  } else {
    $job->{set_position} = 'false';
  }
  $job->{pass2} = &getBoolean($q->param('pass2'));
  $job->{v_v_map} = $q->param('v_map');
  $job->{v_v_copy} = &getBoolean($q->param('v_copy'));
  $job->{v_enable_crop} = &getBoolean($q->param('enable_crop'));
  $job->{v_crop_w} = $q->param('crop_w');
  $job->{v_crop_h} = $q->param('crop_h');
  $job->{v_crop_x} = $q->param('crop_x');
  $job->{v_crop_y} = $q->param('crop_y');
  $job->{v_enable_pad} = &getBoolean($q->param('enable_pad'));
  $job->{v_pad_w} = $q->param('pad_w');
  $job->{v_pad_h} = $q->param('pad_h');
  $job->{v_pad_x} = $q->param('pad_x');
  $job->{v_pad_y} = $q->param('pad_y');
  $job->{v_pad_color} = $q->param('pad_color');
  $job->{v_s_w} = $q->param('s_w');
  $job->{v_s_h} = $q->param('s_h');
  $job->{v_aspect_set} = $q->param('aspect_set');
  $job->{v_aspect_numerator} = $q->param('aspect_numerator');
  $job->{v_aspect_denominator} = $q->param('aspect_denominator');
  $job->{v_r} = $q->param('r');
  $job->{v_b} = $q->param('b');
  $job->{v_enable_adjust} = &getBoolean($q->param('enable_adjust'));
  $job->{v_brightness} = $q->param('brightness');
  $job->{v_contrast} = $q->param('contrast');
  $job->{v_gamma} = $q->param('gamma');
  $job->{v_hue} = $q->param('hue');
  $job->{v_saturation} = $q->param('saturation');
  $job->{v_sharp} = $q->param('sharp');
  $job->{v_rg} = $q->param('rg');
  $job->{v_gg} = $q->param('gg');
  $job->{v_bg} = $q->param('bg');
  $job->{v_weight} = $q->param('weight');
  $job->{v_deinterlace} = &getBoolean($q->param('deinterlace'));
  $job->{v_deshake} = &getBoolean($q->param('deshake'));
  $job->{a_a_map} = $q->param('a_map');
  $job->{a_a_copy} = &getBoolean($q->param('a_copy'));
  $job->{a_ar} = $q->param('ar');
  $job->{a_ab} = $q->param('ab');
  $job->{a_ac} = $q->param('ac');
  $job->{a_cutoff} = $q->param('cutoff');
  $job->{a_volume} = $q->param('volume');

  $job->add();
}

sub check_capable_type
{
  my ($file) = @_;

  if (FileTypes->isSuffixPatternMatch($file, \@support_video_types)) {
    return "video";
  }
  if (FileTypes->isSuffixPatternMatch($file, \@support_audio_types)) {
    return "audio";
  }
  return "unsupported";
}
