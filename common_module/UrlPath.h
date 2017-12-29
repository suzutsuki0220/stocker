#ifndef __URLPATH_CLASS_H__
#define __URLPATH_CLASS_H__ 1

#include <string>

#include "FileUtil.h"
#include "cgi_util.h"

class UrlPath {
private:
    cgi_util *cgi;
    FileUtil *futil;
    std::string err_message;
    std::string confdir;

    void appendSubnameEncode(std::string &subname, std::string &url_path);
 
public:
    UrlPath(const char *confdir);
    ~UrlPath();

    int  getBaseDir(std::string &basedir, std::string &dir_name);
    void encode(std::string &url_path, std::string &file_path);
    void decode(std::string &file_path, std::string &url_path);
    int  getDecodedPath(std::string &decoded_path, std::string &basedir_name, std::string &url_path);

    const char* getErrorMessage(void);
};

#endif  // __URLPATH_CLASS_H__
