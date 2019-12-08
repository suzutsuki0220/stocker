package FileOperator;

sub isFilename {
  my $self = shift;
  my ($name) = @_;

  if (! $name || length($name) > 247) {  # Limitation of Windows Explorer
    return undef;
  }
  if ($name =~ /[\\\/:\?<>|\"\*]/) {
    return undef;
  }

  return 1;
}

# 表示用のファイルサイズ表示
sub getDisplayFileSize
{
  my $self = shift;
  my ($path) = @_;
  my $file_size = (-s "$path");
  my $unit = "B";
  if ($file_size > 1024*1024*1024) {
    $file_size = int($file_size / (1024*1024*1024));
    $unit = "GB";
  } elsif ($file_size > 1024*1024) {
    $file_size = int($file_size / (1024*1024));
    $unit = "MB";
  } elsif ($file_size > 1024) {
    $file_size = int($file_size / (1024));
    $unit = "KB";
  }
  1 while $file_size =~ s/(\d)(\d\d\d)(?!\d)/$1,$2/g;
  $file_size = $file_size ." ". $unit;

  return $file_size;
}

# ファイルシステムの情報取得
sub getDiskSpace
{
  my $self = shift;
  my ($dir) = @_;
  my $ret = "";
  my @line = ();

  open(IN, "df -h ${dir} |") or return;
  while(<IN>) {
    $ret .= $_;
  }
  close(IN);

  # df command response example
  #   ファイルシス   サイズ  使用  残り 使用% マウント位置
  #   /dev/sdb2        1.8T  1.2T  687G   63% /srv
  @line = split(/\n/, $ret);
  if ($#line < 1) {
    print STDERR "failed to check disk space ($dir)\n";
    return;
  }
  my ($size, $use, $remain, $rate) = (split(/[\s\t]{1,}/, $line[1]))[1..4];
  return ($size, $use, $remain, $rate);
}

1;
__END__
