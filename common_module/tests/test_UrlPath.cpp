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
 * $B%Q%?!<%s%A%'%C%/%F%9%H$r9T$&(B
 * 
 * return: 0$B@.8y(B or $B<:GT$7$??t(B
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
        urlpath->decode(decoded, encoded);  // encode -> decode $B$G85$N7k2L$K$J$k$+(B

	std::cout << "UrlPath Encode input[" << pattern[index].input << "], expect [" << pattern[index].output << "], ";
	std::cout << "output [" << encoded << "]";
	if (encoded.compare(pattern[index].output) == 0) {
            std::cout << " [OK]";
	} else {
            std::cout << " [Fail]";
	    ret++;  // $B<:GT$7$??t$r%+%&%s%H(B
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

