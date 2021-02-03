#ifndef __TEST_FILEUTIL_TRAVERSAL_CHECK_PATTERNS_H__
#define __TEST_FILEUTIL_TRAVERSAL_CHECK_PATTERNS_H__

#include <string>

typedef struct traversal_check_pattern {
    std::string input;
    bool result;
} traversal_check_pattern_t;

traversal_check_pattern_t traversal_check[] = {
     "", false
    ,"/", false
    ,"//", false
    ,"/tmp", false
    ,"/tmp/", false
    ,"tmp/", false
    ,".tmp/", false
    ,"..tmp/", false
    ,"./tmp/", false
    ,"tmp/.", false
    ,"tmp./", false
    ,"tmp../", false
    ,"tmp.", false
    ,"tmp..", false
    ,"tmp...", false
    ,"tmp/aaa.", false
    ,"tmp/aaa..", false
    ,"tmp/aaa...", false
    ,"tmp/aa..a", false
    ,"tmp/.aaa", false
    ,"tmp/..aaa", false
    ,"tmp/...aaa", false
    ,"tmp/.aaa/bbb", false
    ,"tmp/..aaa/bbb", false
    ,"tmp/...aaa/bbb", false
    ,"..", true
    ,"/..", true
    ,"./..", true
    ,"../", true
    ,"../../", true
    ,"../..", true
    ,"../aaa", true
    ,"/../aaa", true
    ,"/tmp/aaa/..", true
    ,"tmp/aaa/...", false
    ,"/tmp/aaa/../", true
    ,"/tmp/aaa/.../", false
    ,"/tmp/../aaa", true
    ,"//.//..////", true
    ,"////////..", true
};

#endif  // __TEST_FILEUTIL_TRAVERSAL_CHECK_PATTERNS_H__
