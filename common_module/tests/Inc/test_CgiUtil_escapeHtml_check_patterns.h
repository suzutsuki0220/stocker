#ifndef __TEST_CGIUTIL_ESCAPEHTML_CHECK_PATTERNS_H__
#define __TEST_CGIUTIL_ESCAPEHTML_CHECK_PATTERNS_H__

#include <string>

typedef struct escape_html_check_pattern {
    std::string input;
    std::string output;
} escape_html_check_pattern_t;

escape_html_check_pattern_t escape_html_check[] = {
     "", ""
    ,"&", "&amp;"
    ,"<", "&lt;"
    ,">", "&gt;"
    ,"\"", "&quot;"
    ,"\r", "&#x0d;"
    ,"\n", "&#x0a;"
    ,"a", "a"
    ,"ab", "ab"
    ,"abc", "abc"
    ,"abc&def", "abc&amp;def"
    ,"&&", "&amp;&amp;"
    ,"&&&", "&amp;&amp;&amp;"
//     "&<>\"\r\n", "&amp;&lt;&gt;&quot;&#x0d;&#x0a;"
};

#endif  // __TEST_CGIUTIL_ESCAPEHTML_CHECK_PATTERNS_H__

