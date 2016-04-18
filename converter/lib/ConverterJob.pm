package ConverterJob;

#use strict;
#use warnings;
use utf8;
use XML::Simple;

sub new {
  my $class = shift;
  my $self = {
    _jobid => 0,
    source => '',
    out_dir => '',
    format => '',
    pass2 => 0,
    ss => '',
    t => '',
    v_v_map => '',
    v_v_copy => 0,
    v_enable_crop => 0,
    v_crop_w => '',
    v_crop_h => '',
    v_crop_x => '',
    v_crop_y => '',
    v_enable_pad => 0,
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
    v_enable_adjust => 0,
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
    v_deinterlace => 0,
    v_deshake => 0,
    a_a_map => '',
    a_a_copy => 0,
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

## xml get data sample
#  open (my $in, "/srv/www/192.168.0.241/bin/hd_health/check_hd_health /dev/sda /dev/sdb |") or 
#    die("failed to get hd health");
#  while (my $line = <$in>) {
#    $hd_health_xml .= $line;
#  }
#  close($in);
#
#  my $hd_health = $xml->XMLin($hd_health_xml);
#
#  for ($i=0; $i<@{$hd_health->{'hd_health'}[0]->{'disk'}}; $i++) {
#    my $hdh = $hd_health->{'hd_health'}[0]->{'disk'}[$i];
#    print "<tr><td>";
#    print $hdh->{'name'}[0];
}

sub add
{
  my $self = shift;
#  my ($path) = @_;

print "RUN add<br>\n<pre>";
print &_make_job_xml();
print "</pre>\n";
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

  $data .= "<job>\n";
  $data .= "    <source>".$self->source."</source>\n";
  $data .= "    <out_dir>".$self->out_dir."</out_dir>\n";
  $data .= "    <format>".$self->format."</format>\n";
  $data .= "    <set_position>".$self->set_position."</set_position>\n";
  $data .= "    <ss>".$self->ss."</ss>\n";
  $data .= "    <t>".$self->t."</t>\n";
  $data .= "    <pass2>".$self->pass2."</pass2>\n";
  $data .= "    <video>\n";
  $data .= "          <v_map>".$self->v_v_map."</v_map>\n";
  $data .= "          <v_copy>".$self->v_v_copy."</v_copy>\n";
  $data .= "          <enable_crop>".$self->v_enable_crop."</enable_crop>\n";
  $data .= "          <crop_w>".$self->v_crop_w."</crop_w>\n";
  $data .= "          <crop_h>".$self->v_crop_h."</crop_h>\n";
  $data .= "          <crop_x>".$self->v_crop_x."</crop_x>\n";
  $data .= "          <crop_y>".$self->v_crop_y."</crop_y>\n";
  $data .= "          <enable_pad>".$self->v_enable_pad."</enable_pad>\n";
  $data .= "          <pad_w>".$self->v_pad_w."</pad_w>\n";
  $data .= "          <pad_h>".$self->v_pad_h."</pad_h>\n";
  $data .= "          <pad_x>".$self->v_pad_x."</pad_x>\n";
  $data .= "          <pad_y>".$self->v_pad_y."</pad_y>\n";
  $data .= "          <pad_color>".$self->v_pad_color."</pad_color>\n";
  $data .= "          <s_w>".$self->v_s_w."</s_w>\n";
  $data .= "          <s_h>".$self->v_s_h."</s_h>\n";
  $data .= "          <aspect_set>".$self->v_aspect_set."</aspect_set>\n";
  $data .= "          <aspect_numerator>".$self->v_aspect_numerator."</aspect_numerator>\n";
  $data .= "          <aspect_denominator>".$self->v_aspect_denominator."</aspect_denominator>\n";
  $data .= "          <r>".$self->v_r."</r>\n";
  $data .= "          <b>".$self->v_b."</b>\n";
  $data .= "          <enable_adjust>".$self->v_enable_adjust."</enable_adjust>\n";
  $data .= "          <brightness>".$self->v_brightness."</brightness>\n";
  $data .= "          <contrast>".$self->v_contrast."</contrast>\n";
  $data .= "          <gamma>".$self->v_gamma."</gamma>\n";
  $data .= "          <hue>".$self->v_hue."</hue>\n";
  $data .= "          <saturation>".$self->v_saturation."</saturation>\n";
  $data .= "          <sharp>".$self->v_sharp."</sharp>\n";
  $data .= "          <rg>".$self->v_rg."</rg>\n";
  $data .= "          <gg>".$self->v_gg."</gg>\n";
  $data .= "          <bg>".$self->v_bg."</bg>\n";
  $data .= "          <weight>".$self->v_weight."</weight>\n";
  $data .= "          <deinterlace>".$self->v_deinterlace."</deinterlace>\n";
  $data .= "          <deshake>".$self->v_deshake."</deshake>\n";
  $data .= "    </video>\n";

  $data .= "    <audio>\n";
  $data .= "          <a_map>".$self->a_a_map."</a_map>\n";
  $data .= "          <a_copy>".$self->a_a_copy."</a_copy>\n";
  $data .= "          <ar>".$self->a_ar."</ar>\n";
  $data .= "          <ac>".$self->a_ac."</ac>\n";
  $data .= "          <cutoff>".$self->a_cutoff."</cutoff>\n";
  $data .= "          <volume>".$self->a_volume."</volume>\n";
  $data .= "    </audio>\n";

  $data .= "</job>\n";

  return $data;
}


1; # __EXIT__

