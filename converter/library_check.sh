#!/usr/bin/perl

sub check() {
    my ($libname) = @_;

    eval{
        my $module = $libname;
        $module =~ s/::/\//g;
        $module .= ".pm";
        require($module);
    };
    if ($@) {
        print "[FAIL] unable to load ${libname}\n$@\n";
        return 1;
    }
    print "[ OK ] ${libname}\n";
    return 0;
}


&check("Audio::Wav");
&check("Archive::Zip");
&check("Audio::FLAC::Header");
&check("Audio::hoge");
