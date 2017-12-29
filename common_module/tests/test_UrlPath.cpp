#include <iostream>
#include <string>

#include "UrlPath.h"

typedef struct test_pattern {
    std::string input;
    std::string output;
} test_pattern_t;

test_pattern_t pattern[] = {
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
};

/**
 * encode の後に decode したら元の値と同じかチェックする
**/
static inline bool
checkReverse(std::string &decoded, std::string &input)
{
    bool ret = false;
    std::string canon_decoded;
    std::string canon_input;

    FileUtil *fileutil = new FileUtil();

    fileutil->getCanonicalizePath(canon_decoded, decoded);
    fileutil->getCanonicalizePath(canon_input, input);

    if (canon_decoded.compare(canon_input) == 0) {
        std::cout << ", decode reverse [OK]";
	ret = true;
    } else {
        std::cout << ", decode reverse [Fail] -> [" << canon_decoded << "]";
    }

    delete fileutil;

    return ret;
}

/**
 * パターンチェックテストを行う
 * 
 * return: 0成功 or 失敗した数
**/
int
main(int argc, char **argv)
{
    int ret = 0;
    size_t index;
    UrlPath *urlpath = new UrlPath(NULL);
    std::string encoded, decoded;

    index = 0;
    while (index < sizeof(pattern) / sizeof(pattern[0])) {
        urlpath->encode(encoded, pattern[index].input);
        urlpath->decode(decoded, encoded);  // encode -> decode して元に戻るかチェックする目的

	std::cout << "UrlPath Encode input[" << pattern[index].input << "], expect [" << pattern[index].output << "], ";
	std::cout << "output [" << encoded << "]";
	if (encoded.compare(pattern[index].output) == 0) {
            std::cout << " [OK]";
	} else {
            std::cout << " [Fail]";
	    ret++;  // 失敗した数をカウント
	}

	if (checkReverse(decoded, pattern[index].input) == false) {
	    ret++;
	}

	std::cout << std::endl;
        index++;
    }

    delete urlpath;

    return ret;
}

