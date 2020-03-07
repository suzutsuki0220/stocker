#include <iostream>
#include <string>
#include <cerrno>
#include <cstdio>
#include <cstring>
#include <sstream>
#include <stdexcept>

#include "UrlPath.h"
#include "Config.h"

UrlPath::UrlPath()
{
    this->cgi = new cgi_util();
    this->futil = new FileUtil();
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

/**
 * basedirs.conf に設定された、メディアのディレクトリを取得する
 *
 * @param : basedir (OUT) メディアのディレクトリ
 * @param : dir_name (IN) 設定ファイルに定義されているディレクトリの名前 (URLエンコードされた値)
 * @return 0:成功  -1:失敗
**/
int
UrlPath::getBaseDir(std::string &basedir, std::string &dir_name)
{
    int ret = -1;

    Config *conf = new Config();
    std::string confpath, decoded_dir_name;

    basedir.clear();

    const char *env_conf = getenv("STOCKER_CONF");
    if (env_conf == NULL) {
        std::stringstream ss;
        ss << "environment missing - " << conf->getErrorMessage();
        err_message = ss.str();
        goto end;
    }

    confpath = env_conf;
    confpath.append("/basedirs.conf");
    if (conf->parse(confpath.c_str()) != 0) {
	std::stringstream ss;
        ss << "failed to parse basedir - " << conf->getErrorMessage() << " " <<  confpath;
	err_message = ss.str();
        goto end;
    }

    decoded_dir_name = cgi->decodeFormURL(dir_name);
    basedir = conf->get(decoded_dir_name.c_str());
    if (basedir.empty()) {
	std::stringstream ss;
        ss << "basedir get failed [" << decoded_dir_name << "] - " << conf->getErrorMessage();
	err_message = ss.str();
        goto end;
    }
    ret = 0;

end:
    return ret;
}

/**
 * ファイルパスからURLパスを求める
**/
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

/**
 * URLパスからファイルパスを求める
**/
void
UrlPath::decode(std::string &file_path, std::string &url_path)
{
    std::string split_name;
    std::string::size_type start_pos, end_pos;

    //replace '%2F' -> '/'
    start_pos = 0;
    while((start_pos = url_path.find("%2F", start_pos)) != std::string::npos) {
        url_path.replace(start_pos, 3, "/");
        start_pos += 1;
    }

    if (url_path == "/") {
        file_path = "/";
        return;
    }

    try {
	start_pos = 0;
        do {
	    end_pos = url_path.find('/', start_pos);
	    if (start_pos != end_pos) {
                if (end_pos == std::string::npos) {
                    end_pos = url_path.length();
                }
                split_name = url_path.substr(start_pos, end_pos - start_pos);
		if (cgi->decodeBase64URL(split_name) != 0) {
		    err_message = "failed to decode file parameter";
		    file_path.clear();
		    return;
		}
		file_path.append("/");
		file_path.append(split_name);
	    }
	    start_pos = end_pos + 1;
	} while(start_pos < url_path.length());
    } catch (std::invalid_argument &e) {
	err_message = e.what();
	file_path.clear();
	return;
    }
}

int
UrlPath::getDecodedPath(std::string &decoded_path, std::string &basedir_name, std::string &url_path)
{
    std::string path;
    std::string decoded;

    decoded_path.clear();

    if (getBaseDir(path, basedir_name) != 0) {
        // no such directory
	return -1;
    }

    if (!url_path.empty()) {
	decode(decoded, url_path);
	if (decoded.empty()) {
	    // decode failed
	    return -2;
	}

	if (futil->isTraversalPath(decoded) == true) {
	    err_message = "invalid URL path";
	    return -3;
	}

	if (futil->isLostFound(decoded) == true) {
	    err_message = "path not found";
	    return -4;
	}

	path.append("/");
	path.append(decoded);
    }

    futil->getCanonicalizePath(decoded_path, path);

    return 0;
}

const char*
UrlPath::getErrorMessage(void)
{
    return this->err_message.c_str();
}

