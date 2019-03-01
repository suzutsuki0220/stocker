package FileTypes;

use utf8;
use strict;
use warnings;
use Encode;

sub new {
  my $class = shift;
  my $self = {
    #    base_dir_conf => '',
    @_,
  };

  return bless $self, $class;
}

sub makeSuffixPattern {
  my $self = shift;

  my $types_ref = shift;
  my $ret = "";

  foreach my $type (@$types_ref) {
    if (length($ret) != 0) {
      $ret .= "|";
    }
    $ret .= $type;
  }

  return $ret;
}

sub makeSuffixPatternString {
  my $self = shift;
  my $types_ref = shift;

  return "/\\.(" . $self->makeSuffixPattern($types_ref) . ")\$/i";
}

sub isSuffixPatternMatch {
  my $self = shift;

  my $string = shift;
  my $types_ref = shift;
  my $pattern_string = "\\.(" . $self->makeSuffixPattern($types_ref) . ")\$";

  return (${string} =~ /${pattern_string}/i);
}

1;
__END__
