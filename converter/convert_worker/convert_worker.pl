#!/usr/bin/perl

use strict;
use warnings;
use utf8;
use Encode;
use File::Path;
use XML::Simple;

use lib '%libs_dir%';
use ParamPath;
use ConverterJob;

our $BASE_DIR_CONF  = "";
our $FFMPEG_CMD     = "";
our $TMP_PATH       = "";
our $CONV_OUT_DIR   = "";
our $ENCODE_BATCH   = "";
our $ENCBATCH_LIST  = "";
require '%conf_dir%/converter.conf';

our @CONVERT_PARAMS;
require '%conf_dir%/ConvertParams.pl';

while(1) {
  if (-f "$ENCBATCH_LIST") {
    my $job = ConverterJob->new(listfile => "$ENCBATCH_LIST");
    if ($job) {
      my @list = $job->list();
      if ($#list < 0) {
        unlink("$ENCBATCH_LIST");
      } else {
        &worker(\$job, $list[0]);
        next;
      }
    } else {
      print STDERR "failed to make ConvertJob instance\n";
      unlink("$ENCBATCH_LIST");
    }
  }
  sleep(60);
}

exit 0;

#####

sub worker
{
  my ($job, $job_num) = @_;
  my @ss_list = ();
  my @t_list  = ();

  $$job->get($job_num);
  $$job->delete($job_num);

  my $outdir = $CONV_OUT_DIR ."/". $$job->{'out_dir'};
  if (! -d "$outdir") {
    mkpath ("$outdir");
  }

  if (open(my $fd, "> ${outdir}/parameter_".$$job->{'_jobid'}.".xml")) {
    print $fd encode('utf-8', $$job->make_job_xml());
    close($fd);
  }

  my $log_file = ${outdir}."/encodelog_".$$job->{'_jobid'}.".txt";

  if ($$job->{'set_position'} eq "true") {
    my $ssref = $$job->{'ss'};
    my $tref  = $$job->{'t'};
    @ss_list = @$ssref;
    @t_list  = @$tref;
    $$job->{'ss'} = shift(@ss_list);
    $$job->{'t'}  = shift(@t_list);
  }

  while ($job) {
    if($$job->{'pass2'} eq "true") {
      # 2pass 有効
      &run_converter($job, 1, $log_file) and &run_converter($job, 2, $log_file);
    } else {
      # 2pass 無効
      &run_converter($job, 0, $log_file);
    }

    if ($$job->{'set_position'} eq "true" && $#ss_list >= 0) {
      $$job->{'ss'} = shift(@ss_list);
      $$job->{'t'}  = shift(@t_list);
    } else {
      undef($job);
    }
  }

  return;
}

sub set_general_option
{
  my ($job) = @_;
  my $general_option = "";
  $general_option .= " -y";  # 強制上書き
  $general_option .= " -threads 2";  # エンコードスレッド数

#  privent unspecified sample format ERROR
#  $general_option .= " -analyzeduration 30M -probesize 30M";

  if ($$job->{'set_position'} eq "true" && $$job->{'t'} ne '00:00:00.000') {
    $general_option .= " -t ".$$job->{'t'};
  }

  return $general_option;
}

sub set_video_option
{
  my ($job, $codec, $pass, $extopt) = @_;

  my @vf_option = ();
  my $video_option = "";
  $video_option .= " -map 0:".$$job->{'v_v_map'};

  # 無変換オプション
  if ($$job->{'v_v_copy'} eq "true") {
    $video_option .= " -c:v copy";
    return $video_option;
  }

  $video_option .= " -c:v ${codec}";

  #$video_option .= " -s ". $$job->{'v_s_w'} . "x" . $$job->{'v_s_h'};  # 解像度
  $video_option .= " -b:v ".$$job->{'v_b'}."k";   # 動画ビットレート
  $video_option .= " -r ".$$job->{'v_r'};         # フレームレート

  if($$job->{'v_deinterlace'}  eq "true") {
    #$video_option .= " -deinterlace -top -1";
    push(@vf_option, "yadif=0:-1");
  }
  if($$job->{'v_deshake'} eq "true") {
#    push(@vf_option, "deshake=rx=64:ry=64,crop=9/10*in_w:9/10*in_h");
    my $analyze_result = $CONV_OUT_DIR ."/". $$job->{'out_dir'} . "/stabilize.trf";
    if ($pass == 1) {
      push(@vf_option, "vidstabdetect=shakiness=10:accuracy=15:result=\"${analyze_result}\"");
    } elsif ($pass == 2) {
      push(@vf_option, "vidstabtransform=zoom=5:input=\"${analyze_result}\"");
    }
  }
  if($$job->{'v_enable_crop'} eq "true") {
    push(@vf_option, "crop=".$$job->{'v_crop_w'}.":".$$job->{'v_crop_h'}.":".$$job->{'v_crop_x'}.":".$$job->{'v_crop_y'});
  }
  if($$job->{'v_enable_pad'} eq "true") {
    push(@vf_option, "pad=".$$job->{'v_pad_w'}.":".$$job->{'v_pad_h'}.":".$$job->{'v_pad_x'}.":".$$job->{'v_pad_y'}.":".$$job->{'v_pad_color'});
  }
  if ($$job->{'v_enable_adjust'} eq "true") {
    push(@vf_option, "eq=gamma=".$$job->{'v_gamma'}.":contrast=".$$job->{'v_contrast'}.":brightness=".$$job->{'v_brightness'}.":gamma_r=".$$job->{'v_rg'}.":gamma_g=".$$job->{'v_gg'}.":gamma_b=".$$job->{'v_bg'}.":gamma_weight=".$$job->{'v_weight'});
    push(@vf_option, "hue=h=".$$job->{'v_hue'}.":s=".$$job->{'v_saturation'});
    push(@vf_option, "unsharp=3:3:".$$job->{'v_sharp'});
  }
  push(@vf_option, "scale=".$$job->{'v_s_w'}.":".$$job->{'v_s_h'});  # 解像度

  my $numerator   = $$job->{'v_aspect_numerator'};
  my $denominator = $$job->{'v_aspect_denominator'};

  if ($$job->{'v_aspect_set'} eq "setsar") {
    push(@vf_option, "setsar=ratio=${numerator}/${denominator}:max=1000");
  } elsif ($$job->{'v_aspect_set'} eq "setdar") {
    push(@vf_option, "setdar=ratio=${numerator}/${denominator}:max=1000");
  }

  if ($#vf_option >= 0) {
    $video_option .= " -vf \"";
    foreach (@vf_option) {
      $video_option .= $_ . ",";
    }
    $video_option =~ s/,$/\"/;
  }

  if (length($extopt) > 0) {
    $video_option .= " $extopt";
  }

  return $video_option;
}

sub set_audio_option
{
  my ($job, $codec, $extopt) = @_;

  my $audio_option = "";
  $audio_option .= " -map 0:".$$job->{'a_a_map'};

  # 無変換オプション
  if ($$job->{'a_a_copy'} eq "true") {
    $audio_option .= " -c:a copy";
    return $audio_option;
  }

  $audio_option .= " -c:a ".${codec};
  $audio_option .= " -ac ".$$job->{'a_ac'} if ($$job->{'a_ac'});   # 音声チャンネル
  $audio_option .= " -ar ".$$job->{'a_ar'} if ($$job->{'a_ar'});   # 音声サンプリングレート
  if (! &is_lossless(${codec})) {
    $audio_option .= " -b:a ".$$job->{'a_ab'}."k";  # 音声ビットレート
  }
  if($$job->{'a_cutoff'} && $$job->{'a_cutoff'} ne "0") {
    $audio_option .= " -cutoff ".$$job->{'a_cutoff'};  # 高域カット
  }

  my @af_option = ();
  if($$job->{'a_volume'} && $$job->{'a_volume'} ne "1.0") {
    push(@af_option, "volume=".$$job->{'a_volume'});  # 音量
  }
  if($#af_option >= 0) {
    $audio_option .= " -af \"";
    foreach (@af_option) {
      $audio_option .= $_ . ",";
    }
    $audio_option =~ s/,$/\"/;
  }

  if (length($extopt) > 0) {
    $audio_option .= " $extopt";
  }

  return $audio_option;
}

sub is_lossless
{
  my ($codec) = @_;

  if ("${codec}" eq 'flac') {
    return 1;
  } elsif ("${codec}" =~ /^pcm_/) {
    return 1;
  }
  return 0;
}

sub run_converter()
{
  my ($job, $pass, $log_file) = @_;
  my $out_file = "";
  my $pass_string = $pass == 0 ? "" : " pass ". $pass . " ";
  my $ret;

  my $cmd = &make_cmd($job, $pass, \$out_file);
  if (length($cmd) == 0) {
    #error;
    my $error_name = &get_error_name(&rev_temporary_name($out_file, $pass));
    if (open(my $fd, ">> $error_name")) {  # ここでエラーになるとファイルが出来ないので、空ファイルを作る
      close($fd);
    }
    return 0; # FALSE
  }

  if (open(my $fd, ">> $log_file")) {
    print $fd "===${pass_string}===\n". $cmd ."\n=====\n";
    close($fd);
  }

  $ret = system($cmd ." 2>>\"". $log_file."\" >/dev/null </dev/null");
  if ($ret != 0) {
    #error
    my $error_name = &get_error_name(&rev_temporary_name($out_file, $pass));
    rename($out_file, $error_name);
    return 0; # FALSE
  }

  if ($pass == 1) {
    unlink($out_file);
  } else {
    rename($out_file, &rev_temporary_name($out_file, $pass));
  }

  return 1; # TRUE
}

sub make_cmd()
{
  my ($job, $pass, $out_file) = @_;

  $$out_file = $$job->{'source'};
  my $orig_ext;
  $$out_file =~ s/([^\/]{1,})\.([^\.]{0,})$//;
  $$out_file = $1;
  $orig_ext = $2;
  $orig_ext =~ s/\|//g;  # for "concat mode"

  my $position = "";
  if ($$job->{'set_position'} eq "true") {
    if ($$job->{'ss'} ne '00:00:00.000') {
      $position = " -ss ".$$job->{'ss'};
    }

    my $ss_sec = $$job->{'ss'};
    $ss_sec =~ s/[:\.]//g;
    $$out_file = $ss_sec."_".$$out_file;
  }

  my $option = "";

  if($$job->{'format'} eq "copy") {
    $$out_file = $CONV_OUT_DIR ."/". $$job->{'out_dir'} ."/". $$out_file .".". $orig_ext;
    $option  = " -c copy ";
    $option .= &set_general_option($job);
  } elsif($$job->{'format'} eq "I-Frame") {
    $$out_file = $CONV_OUT_DIR ."/". $$job->{'out_dir'} ."/". $$out_file ."-%03d.jpg";
    if($$job->{'deinterlace'}) {
      $option .= " -vf \"yadif=0:-1\"";
    }
    $option .= &set_general_option($job);
    #$option .= " -vf select=\"eq(pict_type\\,I)\",tile=8x8";
    $option .= " -r 0.5";
#  } elsif($q->param('format') eq "HighLight") {
#    my $SKIP_SEC = 15;
#    my $duration_sec = &get_video_duration($path);
#
#    if($q->param('deinterlace')) {
#      $option .= " -vf \"yadif=0:-1\"";
#    }
#    $option .= " -r 1";
#    $option .= " -vframes 1 -f image2";
#
#    my $pos=0;
#    while ($pos <= $duration_sec) {
#      my $cmd = "${FFMPEG_CMD} %%POSITION%% -i \"%%INPUT%%\" %%PASSOPT%% %%OPTION%% \"%%OUTPUT%%\"";
#      my $out = $out_path ."/". sprintf("%06d_", $pos). $$out_file .".jpg";
#      $position = " -ss $pos";
#      $cmd =~ s/%%POSITION%%/$position/;
#      $cmd =~ s/%%INPUT%%/$$job->{'source'}/;
#      $cmd =~ s/%%OUTPUT%%/$out/;
#      $cmd =~ s/%%PASS%%//;
#      $cmd =~ s/%%TMP_FILE%%/$TMP_FILE/;
#      $cmd =~ s/%%OPTION%%/$option/;
#
#    print "$cmd\n";
#      if($q->param('to_que')) {
#        &add_batch($cmd);
#      } else {
#        system("$cmd 2>&1");
#      }
#
#$pos += $SKIP_SEC;
#  }}

  } else {
    foreach my $lst (@CONVERT_PARAMS) {
      if($$job->{'format'} eq @{$lst}[0]) {
        if (length(@{$lst}[1]) > 0) {
          $$out_file = $CONV_OUT_DIR ."/". $$job->{'out_dir'} ."/". $$out_file .".". @{$lst}[1];
        } else {
          $$out_file = $CONV_OUT_DIR ."/". $$job->{'out_dir'} ."/". $$out_file .".". $orig_ext;
        }
        $option .= &set_general_option($job);
        if (length(@{$lst}[2]) > 0) {
          $option .= &set_video_option($job, @{$lst}[2], $pass, @{$lst}[3]);
        } else {
          $option .= " -vn";
        }
        if (length(@{$lst}[4]) > 0) {
          $option .= &set_audio_option($job, @{$lst}[4], @{$lst}[5]);
        } else {
          $option .= " -an";
        }
        if (length(@{$lst}[6]) > 0) {
          $option .= " -f ". @{$lst}[6];
        }
      }
    }
  }

  if (length($option) == 0) {
    print STDERR '不正なフォーマットが指定されました';
    return;
  }

  my $passlog_file = $CONV_OUT_DIR ."/". $$job->{'out_dir'} ."/passlog.dat";
  my $pass_opt = "";
  if($pass == 1) {
    $pass_opt = " -pass 1 -passlogfile ${passlog_file}";
  } elsif($pass == 2) {
    $pass_opt = " -pass 2 -passlogfile ${passlog_file}";
  }
  $$out_file = &get_temporary_name($$out_file, $pass);

  my $enc_cmd = ${FFMPEG_CMD} . ${position} . " -i \"" . $$job->{'source'} . "\"" . $pass_opt . $option . " \"" . $$out_file . "\"";

  return $enc_cmd;
}

# 変換中はファイル名に"__CONVERTING__"を付ける
sub get_temporary_name
{
  my ($name, $pass) = @_;
  my $path = "";

  if ($name =~ /\//) {
    $name =~ s/(.{0,})\/(.+)$//;
    $path = $1 . "/";
    $name = $2;
  }

  if ($pass == 1) {
    $name = "__CONVERTING-1pass__" . $name;
  } elsif ($pass == 2) {
    $name = "__CONVERTING-2pass__" . $name;
  } else {
    $name = "__CONVERTING__" . $name;
  }

  return $path . $name;
}

# 変換が終了した時に "__CONVERTING__" を外す
sub rev_temporary_name
{
  my ($name, $pass) = @_;
  my $path = "";

  if ($name =~ /\//) {
    $name =~ s/(.{0,})\/(.+)$//;
    $path = $1 . "/";
    $name = $2;
  }

  if ($pass == 1) {
    $name =~ s/^__CONVERTING-1pass__//;
  } elsif ($pass == 2) {
    $name =~ s/^__CONVERTING-2pass__//;
  } else {
    $name =~ s/^__CONVERTING__//;
  }

  return $path . $name;
}

# 変換に失敗した場合、ファイル名に"__ERROR__"を付ける
sub get_error_name
{
  my ($name) = @_;
  my $path = "";

  if ($name =~ /\//) {
    $name =~ s/(.{0,})\/(.+)$//;
    $path = $1 . "/";
    $name = $2;
  }

  $name = "__ERROR__" . $name;

  return $path . $name;
}

