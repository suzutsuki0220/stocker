#ifndef __TEST_FILEUTIL_BASENAME_CHECK_PATTERNS_H__
#define __TEST_FILEUTIL_BASENAME_CHECK_PATTERNS_H__

#include <string>

typedef struct basename_check_pattern {
    std::string input;
    std::string expect;
} basename_check_pattern_t;

basename_check_pattern_t basename_check[] = {
     "", ""
    ,"/", ""
    ,"//", ""
    ,"///", ""
    ,".", ""
    ,"..", ".."
    ,"./.", ""
    ,".///.", ""
    ,"aaa", "aaa"
    ,"/aaa", "aaa"
    ,"/aaa/", ""
    ,"aaa/bbb", "bbb"
    ,"/aaa/bbb", "bbb"
    ,".///aaa/.", ""
    ,"/././aaa", "aaa"
    ,"/./aaa/bbb", "bbb"
    ,"/./aaa/bbb/", ""
    ,"/./aaa/bbb/ccc", "ccc"
    ,"/tmp/././aaa", "aaa"
    ,"tmp/aaa/bbb", "bbb"
    ,"//.//.////", ""
    ,"/././././.tmp///.aaa.", ".aaa."
};

#endif  // __TEST_FILEUTIL_BASENAME_CHECK_PATTERNS_H__
