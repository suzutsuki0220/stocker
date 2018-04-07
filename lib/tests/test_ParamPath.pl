#!/usr/bin/perl

use lib '../';
use ParamPath;

eval {
  my $ins = ParamPath->new(base_dir_conf => ".");
  print "Encode: [" . $ins->urlpath_encode("/usr/share/mount") . "]\n";
  print "Decode: [" . $ins->urlpath_decode("/dXNy/c2hhcmU/bW91bnQ") . "]\n";
};
if ($@) {
  print stderr "failed to load ParamPath class - $@";
}

exit(0);

