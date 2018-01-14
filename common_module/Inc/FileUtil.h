#ifndef __FILEUTIL_H__
#define __FILEUTIL_H__ 1

#include <list>

typedef enum {
    PATH_NOTFOUND = 0,
    PATH_FILE,
    PATH_DIRECTORY,
    PATH_CHARDEV,
    PATH_BLKDEV,
    PATH_FIFO
} path_stat;

class FileUtil {
private:
    std::string err_message;
    bool compareSubDirName(std::string &path, std::string pattern);

public:
    FileUtil();
    ~FileUtil();

    std::string get_err_message(void);

    int readFile(FILE *out_fp, const char *path, size_t start, size_t size);
    size_t getFilesize(std::string &path);
    int getDirectoryList(std::list<std::string> &dirlist, std::string &path, bool skip_hide = true);
    path_stat checkPathType(std::string &path);
    bool isLostFound(std::string &path);
    bool isTraversalPath(std::string &path);
    void getCanonicalizePath(std::string &outpath, std::string &path);
    void getUpPath(std::string &output, std::string &path);
    void getBasename(std::string &output, std::string &path);
};

#endif // __FILEUTIL_H__
