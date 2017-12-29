#include <iostream>
#include <string>
#include <cerrno>
#include <cstdio>
#include <cstring>

#include "UrlPath.h"
#include "Config.h"

UrlPath::UrlPath(const char *confdir)
{
    this->cgi = new cgi_util();
    this->futil = new FileUtil();
    this->err_message.clear();

    if (confdir) {
        this->confdir = confdir; /* @param : confdir (IN)   basedir.confがあるディレクトリ */
    }
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

/**
 * basedirs.conf に設定された、メディアのディレクトリを取得する
 *
 * @param : basedir (OUT)  メディアのディレクトリ
 * @param : dir_param (IN) 設定ファイルに定義されているディレクトリの名前
**/
int
UrlPath::getBaseDir(std::string &basedir, const char *dir_param)
{
    int ret = -1;

    Config *conf = new Config();
    char confpath[512] = {0};
    snprintf(confpath, sizeof(confpath), "%s/basedirs.conf", this->confdir.c_str());

    if (conf->parse(confpath) != 0) {
        fprintf(stderr, "failed to parse basedir - %s %s\n", conf->getErrorMessage(), confpath);
        goto end;
    }

    basedir = conf->get(dir_param);
    if (basedir.empty()) {
        fprintf(stderr, "basedir get failed [%s] - %s\n", dir_param, conf->getErrorMessage());
        goto end;
    }
    ret = 0;

end:
    return ret;
}

void
UrlPath::encode(std::string &url_path, std::string &file_path)
{
    std::string split_name;
    std::string::size_type start_pos, end_pos;

    url_path.clear();

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
}

void
UrlPath::decode(std::string &file_path, std::string &url_path)
{
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
}

const char*
UrlPath::getErrorMessage(void)
{
    return this->err_message.c_str();
}

