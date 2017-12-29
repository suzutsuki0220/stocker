#include <iostream>
#include <string>

#include "test_UrlPath_encode_decode_check_patterns.h"
#include "test_UrlPath_basedir_check_patterns.h"
#include "UrlPath.h"

/**
 * encode の後に decode したら元の値と同じかチェックする
**/
static inline bool
checkEncodeReverse(std::string &decoded, std::string &input)
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
 * URLパスのエンコードチェック
**/
int
do_encode_decode_check(UrlPath *urlpath)
{
    int ret = 0;
    size_t index;
    std::string encoded, decoded;

    index = 0;
    while (index < sizeof(encode_decode_pattern) / sizeof(encode_decode_pattern[0])) {
        urlpath->encode(encoded, encode_decode_pattern[index].input);
        urlpath->decode(decoded, encoded);  // encode -> decode して元に戻るかチェックする目的

	std::cout << "UrlPath Encode input[" << encode_decode_pattern[index].input << "], expect [" << encode_decode_pattern[index].output << "], ";
	std::cout << "output [" << encoded << "]";
	if (encoded.compare(encode_decode_pattern[index].output) == 0) {
            std::cout << " [OK]";
	} else {
            std::cout << " [Fail]";
	    ret++;  // 失敗した数をカウント
	}

	if (checkEncodeReverse(decoded, encode_decode_pattern[index].input) == false) {
	    ret++;
	}

	std::cout << std::endl;
        index++;
    }

    return ret;
}

/**
 * ディレクトリ取得チェック
**/
int
do_basedir_check(UrlPath *urlpath)
{
    int ret = 0;
    size_t index;

    int get_result;
    std::string basepath;

    index = 0;
    while (index < sizeof(basedir_pattern) / sizeof(basedir_pattern[0])) {
        get_result = urlpath->getBaseDir(basepath, basedir_pattern[index].dir_name);

	std::cout << "UrlPath basedir name[" << basedir_pattern[index].dir_name << "], expect ";
       	if (basedir_pattern[index].expect == 0) {
	    std::cout << "[" << basedir_pattern[index].basepath << "], basepath [" << basepath << "]";
	    if (basepath.compare(basedir_pattern[index].basepath) == 0) {
                std::cout << " [OK]";
	    } else {
                std::cout << " [Fail]";
	        ret++;  // 失敗した数をカウント
	    }
	} else {
            std::cout << "[!!FALSE!!], ";
	    if (get_result == basedir_pattern[index].expect) {
                std::cout << " [OK]";
	    } else {
                std::cout << " [Fail]";
	        ret++;  // 失敗した数をカウント
	    }
	}

	std::cout << std::endl;
        index++;
    }

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
    int ret;
    UrlPath *urlpath = new UrlPath("./Conf");

    ret = do_encode_decode_check(urlpath);
    if (ret != 0)
	goto END;

    ret = do_basedir_check(urlpath);
    if (ret != 0)
	goto END;

END:
    delete urlpath;

    return ret;
}

