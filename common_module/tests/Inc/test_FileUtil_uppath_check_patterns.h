#ifndef __TEST_FILEUTIL_UPPATH_CHECK_PATTERNS_H__
#define __TEST_FILEUTIL_UPPATH_CHECK_PATTERNS_H__

#include <string>

typedef struct uppath_check_pattern {
    std::string input;
    std::string expect;
} uppath_check_pattern_t;

uppath_check_pattern_t uppath_check[] = {
     "", ""
    ,"/", "/"    // 例外:ルートの上は存在しないが"/"を返す
    ,"//", "/"   // 例外:ルートの上は存在しないが"/"を返す
    ,"///", "/"  // 例外:ルートの上は存在しないが"/"を返す
    ,".", "."    // 例外:相対パスの"."のみはそのまま返す
    ,"./", "."   // 例外:相対パスの"."のみはそのまま返す
    ,"..", ""
    ,"./.", "."
    ,".///.", "."
    ,"aaa", ""
    ,"/aaa", "/"
    ,"/aaa/", "/"
    ,".///aaa/.", "."
    ,"/././aaa", "/"
    ,"/./aaa/bbb", "/aaa"
    ,"/./aaa/bbb/", "/aaa"
    ,"/./aaa/bbb/ccc", "/aaa/bbb"
    ,"/tmp/././aaa", "/tmp"
    ,"tmp/aaa/bbb", "tmp/aaa"
    ,"/tmp/aaa/bbb", "/tmp/aaa"
    ,"//.//.////", "/"
    ,"/././././.tmp///.aaa.", "/.tmp"
    ,"/1/22/333/4444/55555","/1/22/333/4444"
    ,"1/22/333/4444/55555","1/22/333/4444"
};

#endif  // __TEST_FILEUTIL_UPPATH_CHECK_PATTERNS_H__
