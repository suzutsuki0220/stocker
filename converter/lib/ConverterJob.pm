package ConverterJob;

use strict;
use warnings;
use utf8;
use XML::Simple;

my $XML_HEAD = '<?xml version="1.0" encoding="UTF-8"?>'."\n<encode_batch>\n";
my $XML_TAIL = "</encode_batch>\n";

sub new {
  my $class = shift;
  my $self = {
    _jobid => 0,
    listfile => '',
    source => '',
    out_dir => '',
    format => '',
    set_position => '',
    pass2 => '',
    ss => '',
    t => '',
    v_v_map => '',
    v_v_copy => '',
    v_enable_crop => '', 
    v_crop_w => '',
    v_crop_h => '',
    v_crop_x => '',
    v_crop_y => '',
    v_enable_pad => '',
    v_pad_w => '',
    v_pad_h => '',
    v_pad_x => '',
    v_pad_y => '',
    v_pad_color => '',
    v_s_w => '',
    v_s_h => '',
    v_aspect_set => '',
    v_aspect_numerator => '',
    v_aspect_denominator => '',
    v_r => '',
    v_b => '',
    v_enable_adjust => '',
    v_brightness => '',
    v_contrast => '',
    v_gamma => '',
    v_hue => '',
    v_saturation => '',
    v_sharp => '',
    v_rg => '',
    v_gg => '',
    v_bg => '',
    v_weight => '',
    v_deinterlace => '',
    v_deshake => '',
    a_a_map => '',
    a_a_copy => '',
    a_ar => '',
    a_ac => '',
    a_cutoff => '',
    a_volume => '',
    @_,
  };

  return bless $self, $class;
}

sub get
{
  my $self = shift;
  my ($job_num) = @_;
  my $job_matched = 0;
  my $buffer = "";
  my $xml = XML::Simple->new(KeepRoot=>1, ForceArray=>1);

  if (length($self->{'listfile'}) == 0) {
    die("listfile is not set");
  }

  open(my $in, "$self->{'listfile'}") or die("failed to read convert list");
  flock($in, 1);  # 書込みロック
  while (my $line = <$in>) {
    if ($line =~ /^<job/) {
      $line =~ /id=\"(.+)\"/;
      if ($1 eq $job_num) {
        $job_matched = 1;
      }
    }
    if ($job_matched == 1) {
      $buffer .= $line;
      if ($line =~ /^<\/job>/) {
        last;
      }
    }
  }
  close($in);

  if ($job_matched == 0) {
    # job not found
    return -1;
  }

  $self->{'_jobid'} = $job_num;

  my $job = $xml->XMLin($buffer);

  my $gnl = $job->{'job'}->{$job_num};
  $self->{'source'}               = $self->_elm($gnl->{'source'}[0]);
  $self->{'out_dir'}              = $self->_elm($gnl->{'out_dir'}[0]);
  $self->{'format'}               = $self->_elm($gnl->{'format'}[0]);
  $self->{'set_position'}         = $self->_elm($gnl->{'set_position'}[0]);
  $self->{'pass2'}                = $self->_elm($gnl->{'pass2'}[0]);
  $self->{'ss'}                   = $self->_elm($gnl->{'ss'}[0]);
  $self->{'t'}                    = $self->_elm($gnl->{'t'}[0]);

  my $vid = $gnl->{'video'}[0];
  $self->{'v_v_map'}              = $self->_elm($vid->{'v_map'}[0]);
  $self->{'v_v_copy'}             = $self->_elm($vid->{'v_copy'}[0]);
  $self->{'v_enable_crop'}        = $self->_elm($vid->{'enable_crop'}[0]);
  $self->{'v_crop_w'}             = $self->_elm($vid->{'crop_w'}[0]);
  $self->{'v_crop_h'}             = $self->_elm($vid->{'crop_h'}[0]);
  $self->{'v_crop_x'}             = $self->_elm($vid->{'crop_x'}[0]);
  $self->{'v_crop_y'}             = $self->_elm($vid->{'crop_y'}[0]);
  $self->{'v_enable_pad'}         = $self->_elm($vid->{'enable_pad'}[0]);
  $self->{'v_pad_w'}              = $self->_elm($vid->{'pad_w'}[0]);
  $self->{'v_pad_h'}              = $self->_elm($vid->{'pad_h'}[0]);
  $self->{'v_pad_x'}              = $self->_elm($vid->{'pad_x'}[0]);
  $self->{'v_pad_y'}              = $self->_elm($vid->{'pad_y'}[0]);
  $self->{'v_pad_color'}          = $self->_elm($vid->{'pad_color'}[0]);
  $self->{'v_s_w'}                = $self->_elm($vid->{'s_w'}[0]);
  $self->{'v_s_h'}                = $self->_elm($vid->{'s_h'}[0]);
  $self->{'v_aspect_set'}         = $self->_elm($vid->{'aspect_set'}[0]);
  $self->{'v_aspect_numerator'}   = $self->_elm($vid->{'aspect_numerator'}[0]);
  $self->{'v_aspect_denominator'} = $self->_elm($vid->{'aspect_denominator'}[0]);
  $self->{'v_r'}                  = $self->_elm($vid->{'r'}[0]);
  $self->{'v_b'}                  = $self->_elm($vid->{'b'}[0]);
  $self->{'v_enable_adjust'}      = $self->_elm($vid->{'enable_adjust'}[0]);
  $self->{'v_brightness'}         = $self->_elm($vid->{'brightness'}[0]);
  $self->{'v_contrast'}           = $self->_elm($vid->{'contrast'}[0]);
  $self->{'v_gamma'}              = $self->_elm($vid->{'gamma'}[0]);
  $self->{'v_hue'}                = $self->_elm($vid->{'hue'}[0]);
  $self->{'v_saturation'}         = $self->_elm($vid->{'saturation'}[0]);
  $self->{'v_sharp'}              = $self->_elm($vid->{'sharp'}[0]);
  $self->{'v_rg'}                 = $self->_elm($vid->{'rg'}[0]);
  $self->{'v_gg'}                 = $self->_elm($vid->{'gg'}[0]);
  $self->{'v_bg'}                 = $self->_elm($vid->{'bg'}[0]);
  $self->{'v_weight'}             = $self->_elm($vid->{'weight'}[0]);
  $self->{'v_deinterlace'}        = $self->_elm($vid->{'deinterlace'}[0]);
  $self->{'v_deshake'}            = $self->_elm($vid->{'deshake'}[0]);

  my $aud = $gnl->{'audio'}[0];
  $self->{'a_a_map'}              = $self->_elm($aud->{'a_map'}[0]);
  $self->{'a_a_copy'}             = $self->_elm($aud->{'a_copy'}[0]);
  $self->{'a_ar'}                 = $self->_elm($aud->{'ar'}[0]);
  $self->{'a_ac'}                 = $self->_elm($aud->{'ac'}[0]);
  $self->{'a_cutoff'}             = $self->_elm($aud->{'cutoff'}[0]);
  $self->{'a_volume'}             = $self->_elm($aud->{'volume'}[0]);

  return 0;
}

sub list
{
  my $self = shift;

  if (length($self->{'listfile'}) == 0) {
    die("listfile is not set");
  }

  my @lst;
  open(my $in, "$self->{'listfile'}") or die("failed to read convert list");
  flock($in, 1);  # 書込みロック
  while (my $line = <$in>) {
    if ($line =~ /^<job/) {
      $line =~ /id=\"(.+)\"/;
      push(@lst, $1);
    }
  }
  close($in);

  return @lst;
}

sub add
{
  my $self = shift;
#  my ($path) = @_;
  $self->{'_jobid'} = $self->_make_job_number();

  if (length($self->{'listfile'}) == 0) {
    die("listfile is not set");
  }

  if (! -e "$self->{'listfile'}") {
    # ファイルが存在しない場合、空ファイルを作成する
    open(my $fd, ">> $self->{'listfile'}") or die ("$self->{'listfile'} make empty file failed");
    close($fd);
  }

  open(my $fd, "+< $self->{'listfile'}") or die ("$self->{'listfile'} open failed");
  flock($fd, 2);  # 読書きロック

#  my $buffer = "";
  my $last_job_pos = 0;
  while(my $line = <$fd>) {
    if ($line =~ /^$XML_TAIL/) {
      last;
    }
#    $buffer .= $line;
    $last_job_pos += length($line);
  }
  seek($fd, $last_job_pos, 0);
  if ($last_job_pos == 0) {  # file empty
    print $fd $XML_HEAD;
  }

  print $fd $self->_make_job_xml();
  print $fd $XML_TAIL;
  truncate($fd, tell($fd));
  close($fd);
}

sub delete
{
  my $self = shift;
  my ($job_num) = @_;
  my $job_matched = 0;

  if (length($self->{'listfile'}) == 0) {
    die("listfile is not set");
  }

  open(my $fd, "+< $self->{'listfile'}") or die("failed to read convert list");
  flock($fd, 2);  # 読書きロック
  while (my $line = <$fd>) {
    if ($line =~ /^<job/) {
      $line =~ /id=\"(.+)\"/;
      if ($job_num eq $1) {
        $job_matched = 1;
        last;
      }
    }
#    $edit_pos = tell($fd);
  }
  if ($job_matched == 0) {
    # job not found
    close($fd);
    return -1;
  }

  my $out;
  my $tmp_file = $self->{'listfile'} . "__temp__". $$;
  if (!open($out, "> $tmp_file")) {
    # write file failed
    close($fd);
    return -2;
  }
  flock($out, 2);  # 読書きロック

  # 編集対象のjobまでtmp_fileに書き込む
  $job_matched = 0;
  seek($fd, 0, 0);
  while (my $line = <$fd>) {
    if ($line =~ /^<job/) {
      $line =~ /id=\"(.+)\"/;
      if ($job_num eq $1) {
        $job_matched = 1;
        last;
      }
    }
    print $out $line;
  }

  if ($job_matched == 0) {
    # job not found
    close($out);
    close($fd);
    unlink("$tmp_file");
    return -1;
  }

  # 編集対象のjobを読み飛ばす
  while (my $line = <$fd>) {
    if ($line =~ /^<\/job>/) {
      last;
    }
  }

  # 残りの部分を書き込む
  while (my $line = <$fd>) {
    print $out $line;
  }

  close($out);
  close($fd);

  rename($tmp_file, $self->{'listfile'});

  return 0;
}

sub edit
{
  my $self = shift;
  my ($job_num) = @_;
  my $job_matched = 0;
#  my $edit_pos = 0;

  if (length($self->{'listfile'}) == 0) {
    die("listfile is not set");
  }

  open(my $fd, "+< $self->{'listfile'}") or die("failed to read convert list");
  flock($fd, 2);  # 読書きロック
  while (my $line = <$fd>) {
    if ($line =~ /^<job/) {
      $line =~ /id=\"(.+)\"/;
      if ($job_num eq $1) {
        $job_matched = 1;
        last;
      }
    }
#    $edit_pos = tell($fd);
  }
  if ($job_matched == 0) {
    # job not found
    close($fd);
    return -1;
  }

  my $out;
  my $tmp_file = $self->{'listfile'} . "__temp__". $$;
  if (!open($out, "> $tmp_file")) {
    # write file failed
    close($fd);
    return -2;
  }
  flock($out, 2);  # 読書きロック

  # 編集対象のjobまでtmp_fileに書き込む
  $job_matched = 0;
  seek($fd, 0, 0);
  while (my $line = <$fd>) {
    if ($line =~ /^<job/) {
      $line =~ /id=\"(.+)\"/;
      if ($job_num eq $1) {
        $job_matched = 1;
        last;
      }
    }
    print $out $line;
  }

  if ($job_matched == 0) {
    # job not found
    close($out);
    close($fd);
    unlink("$tmp_file");
    return -1;
  }

  # 変更部分のjobを書き込む
  print $out $self->_make_job_xml();

  # 編集対象のjobを読み飛ばす
  while (my $line = <$fd>) {
    if ($line =~ /^<\/job>/) {
      last;
    }
  }

  # 残りの部分を書き込む
  while (my $line = <$fd>) {
    print $out $line;
  }

  close($out);
  close($fd);

  rename($tmp_file, $self->{'listfile'});

  return 0;
}

sub _elm
{
  my $self = shift;
  my ($val) = @_;

  if ($val && !ref($val)) {
    return $val;
  }

  return '';
}

sub _make_job_number
{
  my $job_number = time . rand();

  return $job_number; 
}

sub _make_job_xml
{
  my $self = shift;
  my $data = "";

  $data .= "<job id=\"".$self->{'_jobid'}."\">\n";
  $data .= "    <source>".$self->{'source'}."</source>\n";
  $data .= "    <out_dir>".$self->{'out_dir'}."</out_dir>\n";
  $data .= "    <format>".$self->{'format'}."</format>\n";
  $data .= "    <set_position>".$self->{'set_position'}."</set_position>\n";
  $data .= "    <ss>".$self->{'ss'}."</ss>\n";
  $data .= "    <t>".$self->{'t'}."</t>\n";
  $data .= "    <pass2>".$self->{'pass2'}."</pass2>\n";
  $data .= "    <video>\n";
  $data .= "        <v_map>".$self->{'v_v_map'}."</v_map>\n";
  $data .= "        <v_copy>".$self->{'v_v_copy'}."</v_copy>\n";
  $data .= "        <enable_crop>".$self->{'v_enable_crop'}."</enable_crop>\n";
  $data .= "        <crop_w>".$self->{'v_crop_w'}."</crop_w>\n";
  $data .= "        <crop_h>".$self->{'v_crop_h'}."</crop_h>\n";
  $data .= "        <crop_x>".$self->{'v_crop_x'}."</crop_x>\n";
  $data .= "        <crop_y>".$self->{'v_crop_y'}."</crop_y>\n";
  $data .= "        <enable_pad>".$self->{'v_enable_pad'}."</enable_pad>\n";
  $data .= "        <pad_w>".$self->{'v_pad_w'}."</pad_w>\n";
  $data .= "        <pad_h>".$self->{'v_pad_h'}."</pad_h>\n";
  $data .= "        <pad_x>".$self->{'v_pad_x'}."</pad_x>\n";
  $data .= "        <pad_y>".$self->{'v_pad_y'}."</pad_y>\n";
  $data .= "        <pad_color>".$self->{'v_pad_color'}."</pad_color>\n";
  $data .= "        <s_w>".$self->{'v_s_w'}."</s_w>\n";
  $data .= "        <s_h>".$self->{'v_s_h'}."</s_h>\n";
  $data .= "        <aspect_set>".$self->{'v_aspect_set'}."</aspect_set>\n";
  $data .= "        <aspect_numerator>".$self->{'v_aspect_numerator'}."</aspect_numerator>\n";
  $data .= "        <aspect_denominator>".$self->{'v_aspect_denominator'}."</aspect_denominator>\n";
  $data .= "        <r>".$self->{'v_r'}."</r>\n";
  $data .= "        <b>".$self->{'v_b'}."</b>\n";
  $data .= "        <enable_adjust>".$self->{'v_enable_adjust'}."</enable_adjust>\n";
  $data .= "        <brightness>".$self->{'v_brightness'}."</brightness>\n";
  $data .= "        <contrast>".$self->{'v_contrast'}."</contrast>\n";
  $data .= "        <gamma>".$self->{'v_gamma'}."</gamma>\n";
  $data .= "        <hue>".$self->{'v_hue'}."</hue>\n";
  $data .= "        <saturation>".$self->{'v_saturation'}."</saturation>\n";
  $data .= "        <sharp>".$self->{'v_sharp'}."</sharp>\n";
  $data .= "        <rg>".$self->{'v_rg'}."</rg>\n";
  $data .= "        <gg>".$self->{'v_gg'}."</gg>\n";
  $data .= "        <bg>".$self->{'v_bg'}."</bg>\n";
  $data .= "        <weight>".$self->{'v_weight'}."</weight>\n";
  $data .= "        <deinterlace>".$self->{'v_deinterlace'}."</deinterlace>\n";
  $data .= "        <deshake>".$self->{'v_deshake'}."</deshake>\n";
  $data .= "    </video>\n";

  $data .= "    <audio>\n";
  $data .= "        <a_map>".$self->{'a_a_map'}."</a_map>\n";
  $data .= "        <a_copy>".$self->{'a_a_copy'}."</a_copy>\n";
  $data .= "        <ar>".$self->{'a_ar'}."</ar>\n";
  $data .= "        <ac>".$self->{'a_ac'}."</ac>\n";
  $data .= "        <cutoff>".$self->{'a_cutoff'}."</cutoff>\n";
  $data .= "        <volume>".$self->{'a_volume'}."</volume>\n";
  $data .= "    </audio>\n";
  $data .= "</job>\n";

  return $data;
}


1; # __EXIT__

