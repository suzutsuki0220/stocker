#ifndef __TEST_FILEUTIL_CANONICALIZE_CHECK_PATTERNS_H__
#define __TEST_FILEUTIL_CANONICALIZE_CHECK_PATTERNS_H__

#include <string>

typedef struct canonicalize_check_pattern {
    std::string input;
    std::string expect;
} canonicalize_check_pattern_t;

canonicalize_check_pattern_t canonicalize_check[] = {
     "", ""
    ,"/", "/"
    ,"//", "/"
    ,"///", "/"
    ,".", ""
    ,"..", ".."
    ,"./../", "../"
    ,"./.", ""
    ,"././", ""
    ,"././.", ""
    ,".///.", ""
    ,"./aaa/.", "aaa/"
    ,".///aaa/.", "aaa/"
    ,"/././aaa", "/aaa"
    ,"/tmp/./aaa/..", "/tmp/aaa/.."
    ,"/tmp/././aaa", "/tmp/aaa"
    ,"tmp/aaa/...", "tmp/aaa/..."
    ,"/tmp/aaa/./", "/tmp/aaa/"
    ,"/tmp/aaa/././", "/tmp/aaa/"
    ,"//.//.////", "/"
    ,"////////", "/"
    ,"/././././.tmp///.aaa.", "/.tmp/.aaa."
};

#endif  // __TEST_FILEUTIL_CANONICALIZE_CHECK_PATTERNS_H__
