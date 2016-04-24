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
    listfile => '/tmp/convertlist.xml',
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
#use Data::Dumper;
#print Dumper($job->{'job'}->{$job_num}->{'video'}[0]);
#return;
  $self->{'source'}               = $job->{'job'}->{$job_num}->{'source'}[0];
  $self->{'out_dir'}              = $job->{'job'}->{$job_num}->{'out_dir'}[0];
  $self->{'format'}               = $job->{'job'}->{$job_num}->{'format'}[0];
  $self->{'set_position'}         = $job->{'job'}->{$job_num}->{'set_position'}[0];
  $self->{'pass2'}                = $job->{'job'}->{$job_num}->{'pass2'}[0];
  $self->{'ss'}                   = $job->{'job'}->{$job_num}->{'ss'}[0];
  $self->{'t'}                    = $job->{'job'}->{$job_num}->{'t'}[0];
  $self->{'v_v_map'}              = $job->{'job'}->{$job_num}->{'video'}[0]->{'v_map'}[0];
  $self->{'v_v_copy'}             = $job->{'job'}->{$job_num}->{'video'}[0]->{'v_copy'}[0];
  $self->{'v_enable_crop'}        = $job->{'job'}->{$job_num}->{'video'}[0]->{'enable_crop'}[0];
  $self->{'v_crop_w'}             = $job->{'job'}->{$job_num}->{'video'}[0]->{'crop_w'}[0];
  $self->{'v_crop_h'}             = $job->{'job'}->{$job_num}->{'video'}[0]->{'crop_h'}[0];
  $self->{'v_crop_x'}             = $job->{'job'}->{$job_num}->{'video'}[0]->{'crop_x'}[0];
  $self->{'v_crop_y'}             = $job->{'job'}->{$job_num}->{'video'}[0]->{'crop_y'}[0];
  $self->{'v_enable_pad'}         = $job->{'job'}->{$job_num}->{'video'}[0]->{'enable_pad'}[0];
  $self->{'v_pad_w'}              = $job->{'job'}->{$job_num}->{'video'}[0]->{'pad_w'}[0];
  $self->{'v_pad_h'}              = $job->{'job'}->{$job_num}->{'video'}[0]->{'pad_h'}[0];
  $self->{'v_pad_x'}              = $job->{'job'}->{$job_num}->{'video'}[0]->{'pad_x'}[0];
  $self->{'v_pad_y'}              = $job->{'job'}->{$job_num}->{'video'}[0]->{'pad_y'}[0];
  $self->{'v_pad_color'}          = $job->{'job'}->{$job_num}->{'video'}[0]->{'pad_color'}[0];
  $self->{'v_s_w'}                = $job->{'job'}->{$job_num}->{'video'}[0]->{'s_w'}[0];
  $self->{'v_s_h'}                = $job->{'job'}->{$job_num}->{'video'}[0]->{'s_h'}[0];
  $self->{'v_aspect_set'}         = $job->{'job'}->{$job_num}->{'video'}[0]->{'aspect_set'}[0];
  $self->{'v_aspect_numerator'}   = $job->{'job'}->{$job_num}->{'video'}[0]->{'aspect_numerator'}[0];
  $self->{'v_aspect_denominator'} = $job->{'job'}->{$job_num}->{'video'}[0]->{'aspect_denominator'}[0];
  $self->{'v_r'}                  = $job->{'job'}->{$job_num}->{'video'}[0]->{'r'}[0];
  $self->{'v_b'}                  = $job->{'job'}->{$job_num}->{'video'}[0]->{'b'}[0];
  $self->{'v_enable_adjust'}      = $job->{'job'}->{$job_num}->{'video'}[0]->{'enable_adjust'}[0];
  $self->{'v_brightness'}         = $job->{'job'}->{$job_num}->{'video'}[0]->{'brightness'}[0];
  $self->{'v_contrast'}           = $job->{'job'}->{$job_num}->{'video'}[0]->{'contrast'}[0];
  $self->{'v_gamma'}              = $job->{'job'}->{$job_num}->{'video'}[0]->{'gamma'}[0];
  $self->{'v_hue'}                = $job->{'job'}->{$job_num}->{'video'}[0]->{'hue'}[0];
  $self->{'v_saturation'}         = $job->{'job'}->{$job_num}->{'video'}[0]->{'saturation'}[0];
  $self->{'v_sharp'}              = $job->{'job'}->{$job_num}->{'video'}[0]->{'sharp'}[0];
  $self->{'v_rg'}                 = $job->{'job'}->{$job_num}->{'video'}[0]->{'rg'}[0];
  $self->{'v_gg'}                 = $job->{'job'}->{$job_num}->{'video'}[0]->{'gg'}[0];
  $self->{'v_bg'}                 = $job->{'job'}->{$job_num}->{'video'}[0]->{'bg'}[0];
  $self->{'v_weight'}             = $job->{'job'}->{$job_num}->{'video'}[0]->{'weight'}[0];
  $self->{'v_deinterlace'}        = $job->{'job'}->{$job_num}->{'video'}[0]->{'deinterlace'}[0];
  $self->{'v_deshake'}            = $job->{'job'}->{$job_num}->{'video'}[0]->{'deshake'}[0];
  $self->{'a_a_map'}              = $job->{'job'}->{$job_num}->{'audio'}[0]->{'a_map'}[0];
  $self->{'a_a_copy'}             = $job->{'job'}->{$job_num}->{'audio'}[0]->{'a_copy'}[0];
  $self->{'a_ar'}                 = $job->{'job'}->{$job_num}->{'audio'}[0]->{'ar'}[0];
  $self->{'a_ac'}                 = $job->{'job'}->{$job_num}->{'audio'}[0]->{'ac'}[0];
  $self->{'a_cutoff'}             = $job->{'job'}->{$job_num}->{'audio'}[0]->{'cutoff'}[0];
  $self->{'a_volume'}             = $job->{'job'}->{$job_num}->{'audio'}[0]->{'volume'}[0];

  return 0;
}

sub list
{

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
}

sub edit
{
  my $self = shift;
  my ($job_num) = @_;
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

