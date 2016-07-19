#ifndef __CGI_UTIL_H__
#define __CGI_UTIL_H__ 1

#include <map>
#include <list>

class cgi_util {
private:
    std::string err_message;
    std::multimap<std::string, std::string> param;
    size_t max_content_length;

    std::string get_query(void);

public:
    cgi_util();
    ~cgi_util();

    std::string get_err_message(void);
    std::string get_value(const char *key);
    std::list<std::string> get_values(const char *key);

    int parse_param(void);
    void setMaxContentLength(size_t maxlength);
    std::string decodeFormURL(std::string &str);
    std::string encodeFormURL(std::string &str);
    int decodeBase64URL(std::string &str);
    int decodeBase64URL(unsigned char **data, size_t *size, std::string &str);
    int decodeBase64(std::string &str);
    int decodeBase64(unsigned char **data, size_t *size, std::string &str);
    std::string encodeBase64URL(std::string &data);
    std::string encodeBase64URL(const unsigned char *data, size_t size);
    std::string encodeBase64(std::string &data);
    std::string encodeBase64(const unsigned char *data, size_t size);
};

#endif  // __CGI_UTIL_H__
