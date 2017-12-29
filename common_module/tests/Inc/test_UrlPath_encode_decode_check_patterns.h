#ifndef __TEST_URLPATH_ENCODE_DECODE_CHECK_PATTERNS_H__
#define __TEST_URLPATH_ENCODE_DECODE_CHECK_PATTERNS_H__

typedef struct test_encode_decode_pattern {
    std::string input;
    std::string output;
} test_encode_decode_pattern_t;

test_encode_decode_pattern_t encode_decode_pattern[] = {
    "",                    "",
    "/",                   "/",
    "file",                "ZmlsZQ",
    "file/",               "ZmlsZQ/",
    "/file",               "/ZmlsZQ",
    "//file",              "/ZmlsZQ",
    "file//",              "ZmlsZQ/",
    "usr/share/mount",     "dXNy/c2hhcmU/bW91bnQ",
    "/usr/share/mount",    "/dXNy/c2hhcmU/bW91bnQ",
    "/usr//share/mount",   "/dXNy/c2hhcmU/bW91bnQ",
    "//usr/share/mount",   "/dXNy/c2hhcmU/bW91bnQ",
    "/usr/share/mount/",   "/dXNy/c2hhcmU/bW91bnQ/",
    "usr//share////mount", "dXNy/c2hhcmU/bW91bnQ",
    "../../etc/passwd",    "Li4/Li4/ZXRj/cGFzc3dk"
};

#endif  // __TEST_URLPATH_ENCODE_DECODE_CHECK_PATTERNS_H__

