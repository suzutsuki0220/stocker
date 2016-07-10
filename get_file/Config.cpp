#include <string>
#include <cerrno>
#include <cstdio>
#include <cstring>

#include "Config.h"

Config::Config()
{
    this->err_message.clear();
}

Config::~Config()
{
    this->param.clear();
}

std::string
Config::trim(std::string &str)
{
    std::string result;
    std::string::size_type left;
    std::string::size_type right;

    left = str.find_first_not_of(" \t\v\r\n");
    if (left != std::string::npos) {
        right = str.find_last_not_of(" \t\v\r\n");
        result = str.substr(left, right - left + 1);
    }

    return result;
}

int
Config::parse(const char *conffile)
{
    int ret = -1;
    FILE *fp = NULL;
    char buf;
    std::string key;
    std::string value;
    bool keyget = false;
    bool comment_get = false;

    this->param.clear();

    fp = fopen(conffile, "r");
    if (fp == NULL) {
        err_message = "config open failed - ";
        err_message.append(strerror(errno));
        err_message.append(" ");
        err_message.append(conffile);
        goto end;
    }
 
    while ((buf = (char)fgetc(fp)) != EOF) {
        if (buf == '\r' || buf == '\n') {
            if (keyget) {
                param[trim(key)] = trim(value);
            }
            keyget = false;
            comment_get = false;
            key.clear();
            value.clear();
        } else {
            if (buf == '#') {
                 comment_get = true;
            }
            if (comment_get == false) {
                if (buf == '=') {
                    keyget = true;
                } else {
                    if (keyget) {
                        value.push_back((char) buf);
                    } else {
                        key.push_back((char) buf);
                    }
                }
            }
        }
    }

    if (ferror(fp)) {
        err_message = "config load error - ";
        err_message.append(strerror(errno));
        goto end;
    }

    ret = 0;

end:
    if (fp != NULL) {
        fclose(fp);
    }

    return ret;
}

std::string
Config::get(const char *key)
{
    std::map<std::string, std::string>::iterator itr = param.find(key);
    if (itr != param.end()) {
        return itr->second;
    } else {
	err_message = "key not found";
        return "";
    }
}

size_t
Config::getParamCount(void)
{
    return this->param.size();
}

std::vector<std::string>
Config::getKeys(void)
{
    std::vector<std::string> result;
    std::map<std::string, std::string>::iterator itr = param.begin();
    while (itr != param.end()) {
        result.push_back(itr->first);
        itr++;
    }

    return result;
}

const char*
Config::getErrorMessage(void)
{
    return this->err_message.c_str();
}
