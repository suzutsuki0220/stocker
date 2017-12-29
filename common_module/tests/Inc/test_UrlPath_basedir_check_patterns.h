#ifndef __TEST_URLPATH_BASEDIR_CHECK_PATTERNS_H__
#define __TEST_URLPATH_BASEDIR_CHECK_PATTERNS_H__

typedef struct test_basedir_pattern {
    std::string dir_name;
    std::string basepath;
    int expect;   // 成功することを期待するなら0、失敗ならエラーコード
} test_basedir_pattern_t;

test_basedir_pattern_t basedir_pattern[] = {
    "",          "", -1,
    "/",         "/", -1,
    "invalid",   "", -1,
    "共有",      "/srv/share", 0,
    "テスト",    "/var/converted", 0,
    "cache",     "/var/cache", 0,
};

#endif  // __TEST_URLPATH_BASEDIR_CHECK_PATTERNS_H__

