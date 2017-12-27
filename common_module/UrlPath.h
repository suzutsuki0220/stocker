#ifndef __URLPATH_CLASS_H__
#define __URLPATH_CLASS_H__ 1

#include <string>

#include "fileutil.h"
#include "cgi_util.h"

class UrlPath {
private:
    cgi_util *cgi;
    fileutil *futil;
    std::string err_message;

    void appendSubnameEncode(std::string &subname, std::string &url_path);
 
public:
    UrlPath();
    ~UrlPath();

    int encode(std::string &url_path, std::string &file_path);
    int decode(std::string &file_path, std::string &url_path);

    const char* getErrorMessage(void);
};

#endif  // __URLPATH_CLASS_H__
