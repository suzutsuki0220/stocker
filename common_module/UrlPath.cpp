#include <iostream>
#include <string>
#include <cerrno>
#include <cstdio>
#include <cstring>

#include "UrlPath.h"

UrlPath::UrlPath()
{
    this->cgi = new cgi_util();
    this->futil = new fileutil(NULL);
    this->err_message.clear();
}

UrlPath::~UrlPath()
{

}

void
UrlPath::appendSubnameEncode(std::string &subname, std::string &url_path)
{
    std::string subname_encode;
    size_t eq_pos;  // encodeした時の余りの "=" を取り除く

    subname_encode = cgi->encodeBase64URL(subname);
    eq_pos = subname_encode.find("=");
    if (eq_pos > 0) {
        url_path.append(subname_encode, 0, eq_pos);
    } else {
        url_path.append(subname_encode);
    }
}

int
UrlPath::encode(std::string &url_path, std::string &file_path)
{
    int ret = 0;
    std::string split_name;
    std::string::size_type start_pos, end_pos;

    url_path.clear();

    if (futil->isTraversalPath(file_path)) {
	return -1;
    }

    if (*file_path.c_str() == '/') {
        url_path = "/";
    } else {
        url_path = "";
    }

    start_pos = 0;
    end_pos = file_path.find('/');
    while (end_pos != std::string::npos) {
        if (start_pos != end_pos) {
            split_name = file_path.substr(start_pos, end_pos - start_pos);
	    appendSubnameEncode(split_name, url_path);
            url_path.append("/");
        }
        start_pos = end_pos + 1;
        end_pos = file_path.find('/', start_pos);
    }
    if (start_pos != file_path.length()) {
        split_name = file_path.substr(start_pos);
        appendSubnameEncode(split_name, url_path);
    }

    return ret;
}

int
UrlPath::decode(std::string &file_path, std::string &url_path)
{
    int ret = 0;
    std::string split_name;
    std::string::size_type start_pos, end_pos;

    if (*url_path.c_str() == '/') {
        file_path = "/";
    } else {
        file_path = "";
    }

    start_pos = 0;
    end_pos = url_path.find('/');
    while (end_pos != std::string::npos) {
        if (start_pos != end_pos) {
            split_name = url_path.substr(start_pos, end_pos - start_pos);
            cgi->decodeBase64URL(split_name);
            file_path.append(split_name);
            file_path.append("/");
        }
        start_pos = end_pos + 1;
        end_pos = url_path.find('/', start_pos);
    }
    if (start_pos != url_path.length()) {
        split_name = url_path.substr(start_pos);
        cgi->decodeBase64URL(split_name);
        file_path.append(split_name);
    }

    if (futil->isTraversalPath(file_path)) {
	file_path.clear();
	ret = -1;
    }

    return ret;
}

const char*
UrlPath::getErrorMessage(void)
{
    return this->err_message.c_str();
}

