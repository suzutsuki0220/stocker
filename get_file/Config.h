#ifndef __CONFIG_CLASS_H__
#define __CONFIG_CLASS_H__ 1

#include <map>
#include <vector>

class Config {
private:
    std::string err_message;
    std::map<std::string, std::string> param;

    std::string trim(std::string &string);

public:
    Config();
    ~Config();

    int parse(const char *conffile);
    std::string get(const char *key);
    size_t getParamCount(void);
    std::vector<std::string> getKeys(void);
    const char* getErrorMessage(void);
};

#endif  // __CONFIG_CLASS_H__
