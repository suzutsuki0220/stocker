#ifndef __RANGE_H__
#define __RANGE_H__ 1

#include <cstdlib>
#include <vector>
#include <string>

class Range {
private:
    typedef struct length_t {
	size_t start;
	size_t end;
	size_t size;
    } length; 

    std::vector<length> length_list;
    std::string err_message;
    size_t maxsize;   // $B:GBgCM$K<h$jF@$k%5%$%:(B ($B%U%!%$%k%5%$%:(B)
    size_t totalsize; // parse$B$7$?HO0O$N9g7WCM(B

public:
    Range();
    ~Range();

    int parse(const char *httprange);
    void set_maxsize(size_t maxsize);
    int add_range(size_t start, size_t size);
    size_t get_totalsize(void);
    size_t get_start(int index);
    size_t get_end(int index);
    size_t get_size(int index);
    int get_listsize(void);

    std::string get_err_message();
};

#endif  // __RANGE_H__
