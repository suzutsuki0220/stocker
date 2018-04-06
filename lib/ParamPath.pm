package ParamPath;

use utf8;
use strict;
use warnings;
use Encode;
use MIME::Base64::URLSafe;  # UrlPath decode/encode

our @BASE_DIRS;

sub new {
  my $class = shift;
  my $self = {
    base_dir_conf => '',
    param_dir => '',
    base => '',
    base_name => '',
    @_,
  };

  return bless $self, $class;
}

sub init {
  my $self = shift;

  require $self->{base_dir_conf};

  foreach my $lst (@BASE_DIRS) {
    if($self->{param_dir} eq @{$lst}[1]) {
      $self->{base_name} = decode('utf-8', @{$lst}[0]);  # 表示名
      $self->{base} = decode('utf-8', @{$lst}[2]);  # 基点となるパス
      if ($self->{base} !~ /\/$/) {
        $self->{base} .= "/";
      }
      last;
    }
  }

  if (length($self->{base}) == 0) {
    die("invalid parameter \"dir\" - ".$self->{param_dir});
  }
  if (! -d ($self->{base})) {
    die("missing configure, base directory is not found - ".$self->{base});
  }
}

sub init_by_base_name {
  my $self = shift;
  my $basename = shift;

  require $self->{base_dir_conf};

  foreach my $lst (@BASE_DIRS) {
    if(!${basename} || ${basename} eq decode('utf-8', @{$lst}[0])) {
      $self->{base_name} = decode('utf-8', @{$lst}[0]);  # 表示名
      $self->{base} = decode('utf-8', @{$lst}[2]);  # 基点となるパス
      if ($self->{base} !~ /\/$/) {
        $self->{base} .= "/";
      }
      last;
    }
  }

  if (length($self->{base}) == 0) {
    die(${basename}." is not in configuration");
  }
  if (! -d ($self->{base})) {
    die("missing configure, [".${basename}."] is invalid directory");
  }
}

sub base_dirs_count {
  return @BASE_DIRS;
}

sub get_base_dir_column {
  my $self = shift;
  my $idx = shift;

  return $BASE_DIRS[$idx];
}

sub get_up_path {
  my $self = shift;
  my $path = shift;

  $path =~ s/\/{1,}$//;   # 末尾が"/"になっているとカット出来ないので、切る
  $path =~ s/\/{2,}/\//g; # splitの分離が奇麗にならないので、二重の"/"は1つにする
  $path =~ s/([^\/]{1,})$//;
  $path =~ s/\/{1,}$//;   # 切り出し後に末尾の"/"を削除する

  return $path;
}

sub get_filename {
  my $self = shift;
  my $path = shift;

  my $file_name = $path;
  $file_name =~ /([^\/]{1,})$/;
  $file_name = $1;

  return $file_name;
}

sub urlpath_encode {
  my $self = shift;
  my($file_path) = @_;

  if (length($file_path) == 0) {
    return "";
  }

  $file_path =~ s/^\///;
  my $url_path = "";

  foreach my $elem (split('/', $file_path)) {
    my $point_path = urlsafe_b64encode($elem);
    $url_path .= "/" . $point_path;
  }

  return $url_path;
}

sub urlpath_decode {
  my $self = shift;
  my($url_path) = @_;

  if (length($url_path) == 0) {
    return "";
  }

  $url_path =~ s/^\///;
  my $file_path = "";

  foreach my $elem (split('/', $url_path)) {
    my $point_path = urlsafe_b64decode($elem);
    $file_path .= "/" . $point_path;
  }

  return $file_path;
}

1;
__END__
