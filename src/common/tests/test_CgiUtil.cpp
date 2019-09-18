#include <iostream>
#include <string>

#include "test_CgiUtil_escapeHtml_check_patterns.h"
#include "cgi_util.h"

/**
 * HTMLエスケープチェック
**/
int
do_escape_html_check(cgi_util *cgiutil)
{
    int ret = 0;
    size_t index;
    std::string escaped;

    index = 0;
    while (index < sizeof(escape_html_check) / sizeof(escape_html_check[0])) {
        escaped = cgiutil->escapeHtml(escape_html_check[index].input);

	std::cout << "CgiUtil HTML escape input[" << escape_html_check[index].input << "], expect [" << escape_html_check[index].output << "], ";
	std::cout << "output [" << escaped << "]";
	if (escaped.compare(escape_html_check[index].output) == 0) {
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

/**
 * main: パターンチェックテストを行う
 *
 * return: 0成功 or 失敗した数
**/
int
main(int argc, char **argv)
{
    int ret;
    cgi_util *cgiutil = new cgi_util();

    ret = do_escape_html_check(cgiutil);
    if (ret != 0)
	goto END;

END:
    delete cgiutil;

    return ret;
}

