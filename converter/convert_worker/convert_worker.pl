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
  my $out_file = "";

  $$job->get($job_num);
  $$job->delete($job_num);

  my $outdir = $CONV_OUT_DIR ."/". $$job->{'out_dir'};
  if (! -d "$outdir") {
    mkpath ("$outdir");
  }

  if (open(my $fd, "> ${outdir}/parameter_".$$job->{'_jobid'}.".xml")) {
    print $fd $$job->make_job_xml();
    close($fd);
  }

  my $log_file = ${outdir}."/encodelog_".$$job->{'_jobid'}.".txt";

  if($$job->{'pass2'} eq "true") {
    mkpath("${TMP_PATH}");

    my $ret;
    my $cmd = &make_cmd($job, 1, \$out_file);
    if (length($cmd) == 0) {
      #error;
    }

    $ret = system($cmd ." 2>>". $log_file." >/dev/null </dev/null");
    if ($ret != 0) {
      #error
    }

    unlink($out_file);

    $cmd = &make_cmd($job, 2, \$out_file);
    if (length($cmd) == 0) {
      #error;
    }
    $ret = system($cmd ." 2>>". $log_file." >/dev/null </dev/null");
    if ($ret != 0) {
      #error
    }

    rename($out_file, &rev_temporary_name($out_file, 2));

    rmtree("${TMP_PATH}");
  } else {
    my $cmd = &make_cmd($job, 0, \$out_file);
    if (length($cmd) == 0) {
      #error;
    }

    my $ret;
    $ret = system($cmd ." 2>>". $log_file." >/dev/null </dev/null");
    if ($ret != 0) {
      #error
    }

    rename($out_file, &rev_temporary_name($out_file, 0));
  }

  return;
}

sub set_general_option
{
  my ($job) = @_;
  my $general_option = "";
  $general_option .= " -y";  # $B6/@)>e=q$-(B
  $general_option .= " -threads 2";  # $B%(%s%3!<%I%9%l%C%I?t(B

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

  # $BL5JQ49%*%W%7%g%s(B
  if ($$job->{'v_v_copy'} eq "true") {
    $video_option .= " -c:v copy";
    return $video_option;
  }

  $video_option .= " -c:v ${codec}";

  #$video_option .= " -s ". $$job->{'v_s_w'} . "x" . $$job->{'v_s_h'};  # $B2rA|EY(B
  $video_option .= " -b:v ".$$job->{'v_b'}."k";   # $BF02h%S%C%H%l!<%H(B
  $video_option .= " -r ".$$job->{'v_r'};         # $B%U%l!<%`%l!<%H(B

  if($$job->{'v_deinterlace'}  eq "true") {
    #$video_option .= " -deinterlace -top -1";
    push(@vf_option, "yadif=0:-1");
  }
  if($$job->{'v_deshake'} eq "true") {
#    push(@vf_option, "deshake=rx=64:ry=64,crop=9/10*in_w:9/10*in_h");
    if ($pass == 1) {
      push(@vf_option, "vidstabdetect=shakiness=10:accuracy=15:result=\"${TMP_PATH}/stabilize.trf\"");
    } elsif ($pass == 2) {
      push(@vf_option, "vidstabtransform=zoom=5:input=\"${TMP_PATH}/stabilize.trf\"");
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
  push(@vf_option, "scale=".$$job->{'v_s_w'}.":".$$job->{'v_s_h'});  # $B2rA|EY(B
  
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

  # $BL5JQ49%*%W%7%g%s(B
  if ($$job->{'a_a_copy'} eq "true") {
    $audio_option .= " -c:a copy";
    return $audio_option;
  }

  $audio_option .= " -c:a ".${codec};
  $audio_option .= " -ac ".$$job->{'a_ac'} if ($$job->{'a_ac'});   # $B2;@<%A%c%s%M%k(B
  $audio_option .= " -ar ".$$job->{'a_ar'} if ($$job->{'a_ar'});   # $B2;@<%5%s%W%j%s%0%l!<%H(B
  if (! &is_lossless(${codec})) {
    $audio_option .= " -b:a ".$$job->{'a_ab'}."k";  # $B2;@<%S%C%H%l!<%H(B
  }
  if($$job->{'a_cutoff'} && $$job->{'a_cutoff'} ne "0") {
    $audio_option .= " -cutoff ".$$job->{'a_cutoff'};  # $B9b0h%+%C%H(B
  }

  my @af_option = ();
  if($$job->{'a_volume'} && $$job->{'a_volume'} ne "1.0") {
    push(@af_option, "volume=".$$job->{'a_volume'});  # $B2;NL(B
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

sub make_cmd()
{
  my ($job, $pass, $out_file) = @_;

  my $tmpfile = ${TMP_PATH} ."/encodelog.dat";
  $$out_file = $$job->{'source'};
  my $orig_ext;
  $$out_file =~ s/([^\/]{1,})\.([^\.]{0,})$//;
  $$out_file = $1;
  $orig_ext = $2;
  $orig_ext =~ s/\|//g;  # for "concat mode"

  my $position = "";
  if ($$job->{'set_position'} eq "true" && $$job->{'ss'} ne '00:00:00.000') {
    $position = "-ss ".$$job->{'ss'};

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
#      $position = "-ss $pos";
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
    print STDERR '$BIT@5$J%U%)!<%^%C%H$,;XDj$5$l$^$7$?(B';
    return;
  }

  $$out_file = &get_temporary_name($$out_file, $pass);

  my $enc_cmd = "${FFMPEG_CMD} %%POSITION%% -i \"%%INPUT%%\" %%PASSOPT%% %%OPTION%% \"%%OUTPUT%%\"";
  $enc_cmd =~ s/%%POSITION%%/$position/;
  $enc_cmd =~ s/%%INPUT%%/$$job->{'source'}/;
  $enc_cmd =~ s/%%OUTPUT%%/$$out_file/;
  $enc_cmd =~ s/%%OPTION%%/$option/;

  my $pass_opt = "";
  if($pass == 1) {
    $pass_opt = "-pass 1 -passlogfile ${tmpfile}";
  } elsif($pass == 2) {
    $pass_opt = "-pass 2 -passlogfile ${tmpfile}";
  }
  $enc_cmd =~ s/%%PASSOPT%%/$pass_opt/;

  return $enc_cmd;
}

# $BJQ49Cf$O%U%!%$%kL>$K(B"__CONVERTING__"$B$rIU$1$k(B
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

# $BJQ49$,=*N;$7$?;~$K(B "__CONVERTING__" $B$r30$9(B
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
