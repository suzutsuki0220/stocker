package ParamPath;

use utf8;
use strict;
use warnings;
use Encode;

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

sub inode_to_path {
  my $self = shift;
  my $inodes = shift;
  my $subdir = "";

  $inodes =~ s/^\/{1,}//;
  if(! $inodes || length($inodes) == 0) {
    return "";
  }

  if(! $inodes || $inodes =~ /[^0123456789\/]/) {
    die("Parameter invalid format");
  }

  if (length($self->{base}) == 0) {
    die("ParamPath class is not initialized");
  }
  if (! -d $self->{base}) {
    die("Directory not found - ".$self->{base});
  }

  foreach my $inode (split('/', $inodes)) {
    my $match_flag = 0;
    opendir(my $dir, $self->{base}.${subdir}) or die("Failed to open directory DIR[${subdir}]");
    while (my $entry = decode('utf-8', readdir($dir))) {
      if ($entry =~ /^\./ || $entry eq 'lost+found') {
        # Ignore hidden file or directory
        next;
      }
      my $point_inode = (stat $self->{base}."${subdir}/${entry}")[1];
      if ($inode == $point_inode) {
        $match_flag = 1;
        if (length($subdir) == 0) {
          $subdir = $entry;
        } else {
          $subdir .= "/" . $entry;
        }
        last;
      }
    }
    closedir($dir);
    if($match_flag == 0) {
      die("No element matched with the parameter");
    }
  }

  return $subdir;
}

sub path_inode {
  my $self = shift;
  my($path, $files) = @_;

  if (length($path) == 0) {
    return "";
  }

  $files =~ s/^\///;
  my $all_inode = "";

  foreach my $elem (split('/', $files)) {
    my $match_flag = 0;
    opendir(my $dir, $path) or return;
    while (my $entry = decode('utf-8', readdir $dir)) {
      if("$elem" eq "$entry") {
        my $point_inode = (stat "$path/$entry")[1];
        $match_flag = 1;
        $path .= "/" . $entry;
        $all_inode .= "/" . $point_inode;
        last;
      }
    }
    closedir($dir);
    if($match_flag == 0) {
      return "";
    }
  }

  return $all_inode;
}

### チェックされたファイルをリストに保持
sub get_checked_list {
  my $self = shift;
  my ($params, $path) = @_;
  my @files;
  opendir(my $dir, "$path") or die("ディレクトリのアクセスに失敗しました - $path");
  while (my $entry = decode('utf-8', readdir $dir)) {
    if (length($entry) > 0 && $entry ne '..'  && $entry ne '.') {
      if (-f "$path/$entry" || -d "$path/$entry") {
        my $cf = $$params->param((stat "$path/$entry")[1]);
        if ($cf && $cf eq "1") {
          push(@files, $entry);
        }
      }
    }
  }
  closedir($dir);

  return @files;
}

1;
__END__
