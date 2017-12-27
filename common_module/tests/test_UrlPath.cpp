#include <iostream>
#include <string>

#include "UrlPath.h"

typedef struct test_pattern {
    std::string input;
    std::string output;
} test_pattern_t;

test_pattern_t pattern[] = {
    "usr/share/mount", "aaa/bbb/ccc",
    "/usr/share/mount", "aaa/bbb/ccc",
    "/usr//share/mount", "aaa/bbb/ccc",
    "//usr/share/mount", "aaa/bbb/ccc",
    "/usr/share/mount/", "aaa/bbb/ccc",
    "usr/share/mount", "aaa/bbb/ccc",
    "usr//share////mount", "aaa/bbb/ccc",
    "file", "aaa",
    "", "",
};

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
    UrlPath *urlpath = new UrlPath();
    std::string encoded, decoded;

    index = 0;
    while (index < sizeof(pattern) / sizeof(pattern[0])) {
        urlpath->encode(encoded, pattern[index].input);
        urlpath->decode(decoded, encoded);  // encode -> decode で元の結果になるか

	std::cout << "UrlPath Encode input[" << pattern[index].input << "], expect [" << pattern[index].output << "], ";
	std::cout << "output [" << encoded << "]";
	if (encoded.compare(pattern[index].output) == 0) {
            std::cout << " [OK]";
	} else {
            std::cout << " [Fail]";
	    ret++;  // 失敗した数をカウント
	}

	if (decoded.compare(pattern[index].input) == 0) {
	    std::cout << ", decode reverse [OK]";
	} else {
	    std::cout << ", decode reverse [Fail] -> [" << decoded << "]";
	}
	std::cout << std::endl;
        index++;
    }

    return ret;
}

