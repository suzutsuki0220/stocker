#!/usr/bin/perl -tW

### enumerate the library below

my @libraries = (
 "utf8"
 ,"Encode"
 ,"Encode::Guess"
 ,"CGI"
 ,"File::Path"
 ,"File::Copy"
 ,"MIME::Base64"
 ,"XML::Simple"
);

#####

print "--- Perl library install check start ---\n";

foreach (@libraries) {
    if (&check($_) != 0) {
        exit 1;
    }
}

print "Perl library check successful!\n";
exit 0;

sub check() {
    my ($libname) = @_;

    eval{
        my $module = $libname;
        $module =~ s/::/\//g;
        $module .= ".pm";
        require($module);
    };
    if ($@) {
        print "[\033[1;31mFAIL\033[0;39m] unable to load \033[1;33m${libname}\033[0;39m\n$@\n";
        return 1;
    }
    print "[ \033[1;32mOK\033[0;39m ] ${libname}\n";

    return 0;
}

