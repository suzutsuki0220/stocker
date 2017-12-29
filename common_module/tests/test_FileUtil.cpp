#include <iostream>
#include <string>

#include "test_FileUtil_traversal_check_patterns.h"
#include "test_FileUtil_canonicalize_check_patterns.h"
#include "FileUtil.h"

static bool
do_traversal_check(FileUtil *fileutil)
{
    int ret = 0;
    size_t index;
    bool traversal_result;

    index = 0;
    while (index < sizeof(traversal_check) / sizeof(traversal_check[0])) {
        traversal_result = fileutil->isTraversalPath(traversal_check[index].input);

	std::cout << "Traversal check input[" << traversal_check[index].input << "], expect [" << traversal_check[index].result << "], ";
	if (traversal_check[index].result == traversal_result) {
            std::cout << " [OK]";
	} else {
            std::cout << " [Fail]";
	    ret++;  // 失敗した数をカウント
	}

	std::cout << std::endl;
        index++;
    }

    return ret;
}

static bool
do_canonicalize_check(FileUtil *fileutil)
{
    int ret = 0;
    size_t index;
    std::string canonicalized_path;

    index = 0;
    while (index < sizeof(canonicalize_check) / sizeof(canonicalize_check[0])) {
        fileutil->getCanonicalizePath(canonicalized_path, canonicalize_check[index].input);

	std::cout << "Canonicalize check input[" << canonicalize_check[index].input << "], expect [" << canonicalize_check[index].expect << "], ";
	if (canonicalized_path.compare(canonicalize_check[index].expect) == 0) {
            std::cout << " [OK]";
	} else {
            std::cout << " [Fail], canonicalized -> [" << canonicalized_path << "]";
	    ret++;  // 失敗した数をカウント
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

    FileUtil *fileutil = new FileUtil();

    ret = do_traversal_check(fileutil);
    if (ret != 0) 
	goto END;

    ret = do_canonicalize_check(fileutil);
    if (ret != 0) 
	goto END;

END:
    delete fileutil;

    return ret;
}

