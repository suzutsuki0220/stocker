package ParamPath;

use strict;
use warnings;

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
      $self->{base_name} = @{$lst}[0];  # 表示名
      $self->{base} = @{$lst}[2];  # 基点となるパス
      if ($self->{base} !~ /\/$/) {
        $self->{base} .= "/";
      }
      last;
    }
  }

  if (length($self->{base}) == 0 || ! -d ($self->{base})) {
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

  if($inodes =~ /[^0123456789\/]/) {
    die("Parameter invalid format");
  }

  if (length($self->{base}) == 0) {
    die("ParamPath class is not initialized");
  }
  if (! -d $self->{base}) {
    die("Directory not found - ".$self->{base});
  }

  $inodes =~ s/^\/{1,}//;
  if(! $inodes || length($inodes) == 0) {
    return "";
  }

  foreach my $inode (split('/', $inodes)) {
    my $match_flag = 0;
    opendir(my $dir, $self->{base}.${subdir}) or die("Failed to open directory DIR[${subdir}]");
    while(my $entry = readdir($dir)) {
      if ($entry =~ /^\./ || $entry eq 'lost+found') {
        # Ignore hidden file or directory
        next;
      }
      my $point_inode = (stat $self->{base}."${subdir}/${entry}")[1];
      if($inode == $point_inode) {
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
    opendir(DIR, $path) or return;
    while(my $entry = readdir DIR) {
      if("$elem" eq "$entry") {
        my $point_inode = (stat "$path/$entry")[1];
        $match_flag = 1;
        $path .= "/" . $entry;
        $all_inode .= "/" . $point_inode;
        last;
      }
    }
    closedir(DIR);
    if($match_flag == 0) {
      return "";
    }
  }

  return $all_inode;
}

1;
__END__
