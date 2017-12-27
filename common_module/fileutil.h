#ifndef __FILEUTIL_H__
#define __FILEUTIL_H__ 1

typedef enum {
    PATH_NOTFOUND = 0,
    PATH_FILE,
    PATH_DIRECTORY,
    PATH_CHARDEV,
    PATH_BLKDEV,
    PATH_FIFO
} path_stat;

class fileutil {
private:
    const char *file;
    std::string err_message;

public:
    fileutil(const char* file);
    ~fileutil();

    std::string get_err_message(void);

    int output_data(FILE *out_fp, size_t start, size_t size);
    size_t getFilesize(std::string &path);
    path_stat checkPathType(std::string &path);
    bool isTraversalPath(std::string &path);
    void getCanonicalizePath(std::string &outpath, std::string &path);
};

#endif // __FILEUTIL_H__
