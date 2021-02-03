#ifndef __TEST_URLPATH_GET_DECODED_CHECK_PATTERNS_H__
#define __TEST_URLPATH_GET_DECODED_CHECK_PATTERNS_H__

typedef struct test_get_decoded_pattern {
    int return_code;
    std::string basedir_name;  // URLエンコードしたもの
    std::string url_path;      // base64でエンコードしたもの
    std::string decoded_path;
} test_get_decoded_pattern_t;

test_get_decoded_pattern_t get_decoded_pattern[] = {
    0,  "cache",  "",                "/var/cache",
    0,  "共有",   "",                "/srv/share",
    0,  "テスト", "",                "/var/converted",
    0,  "cache",  "/",               "/var/cache/",
    0,  "cache",  "//",              "/var/cache/",
    0,  "cache",  "///",             "/var/cache/",
    0,  "cache",  "ZmlsZQ",          "/var/cache/file",
    0,  "cache",  "/ZmlsZQ",         "/var/cache/file",
    0,  "cache",  "//ZmlsZQ",        "/var/cache/file",
    0,  "cache",  "ZmlsZQ/",         "/var/cache/file/",
    0,  "cache",  "/ZmlsZQ/",        "/var/cache/file/",
    0,  "cache",  "ZmlsZQ//",        "/var/cache/file/",
    0,  "cache",  "c2hhcmU/ZmlsZQ",  "/var/cache/share/file",
    0,  "cache",  "c2hhcmU//ZmlsZQ", "/var/cache/share/file",
    0,  "共有",   "c2hhcmU/ZmlsZQ",  "/srv/share/share/file",
    0,  "テスト", "c2hhcmU/ZmlsZQ",  "/var/converted/share/file",
    -1, "", "", "",
    -1, "**INVALID**", "",           "",
    -2, "cache", "**INVALID**",      "",
    -3, "cache", "Li4",      "",
    -3, "cache", "Li4/Li4/ZXRj/cGFzc3dk",      "",
};

#endif  // __TEST_URLPATH_GET_DECODED_CHECK_PATTERNS_H__

