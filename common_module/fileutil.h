#ifndef __FILEUTIL_H__
#define __FILEUTIL_H__ 1

class fileutil {
private:
    const char *file;
    std::string err_message;

public:
    fileutil(const char* file);
    ~fileutil();

    std::string get_err_message(void);

    int output_data(FILE *out_fp, size_t start, size_t size);
    size_t get_filesize(void);
};

#endif // __FILEUTIL_H__
