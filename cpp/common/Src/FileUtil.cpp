#include <cstdio>
#include <cstring>
#include <cerrno>
#include <sys/stat.h>
#include <dirent.h>
#include <string>
#include <sstream>

#include "FileUtil.h"

FileUtil::FileUtil()
{
    this->err_message = "";
}

FileUtil::~FileUtil()
{

}

std::string
FileUtil::get_err_message(void)
{
    return this->err_message;
}

bool
FileUtil::compareSubDirName(std::string &path, std::string pattern)
{
    std::string::size_type start_pos, end_pos;
    std::string split_name;

    start_pos = 0;
    end_pos = path.find('/');
    while (end_pos != std::string::npos) {
        if (start_pos != end_pos) {
            split_name = path.substr(start_pos, end_pos - start_pos);
            if (split_name.compare(pattern) == 0) {
                return true;
            }
        }
        start_pos = end_pos + 1;
        end_pos = path.find('/', start_pos);
    }
    if (start_pos != path.length()) {
        split_name = path.substr(start_pos);
        if (split_name.compare(pattern) == 0) {
            return true;
        }
    }

    return false;
}

int 
FileUtil::readFile(FILE *out_fp, const char *path, size_t start, size_t size)
{
    int ret = -1;
    FILE *fp = NULL;
    char buff[BUFSIZ];

    fp = fopen(path, "r");
    if(fp == NULL) {
        err_message = "file open failed - ";
        err_message += path; 
        return -1;
    }

    size_t remain = size;
    fseek(fp, start, SEEK_SET);
    while (remain > 0) {
        size_t read_size;
        size_t out_size = sizeof(buff) -1;

        memset(buff, '\0', sizeof(buff));
        if (remain < sizeof(buff) -1) {
            out_size = remain;
        }
        read_size = fread(buff, sizeof(char), out_size, fp);
        if (read_size <= 0) {
            if (feof(fp)) {
                std::stringstream ss;
                ss << "read file reached EOF, size parameter is bigger than filesize? - start=" << start << ", size=" << size << ", read=" << size-remain;
                err_message = ss.str();
                break;
            } else if (ferror(fp)) {
                std::stringstream ss;
                ss << "read error - " << strerror(errno) << "(" << errno << ")";
                err_message = ss.str();
                goto END;
            }
        }
        fwrite(buff, sizeof(char), read_size, out_fp);
        remain -= read_size;
    }
    ret = 0;

END:
    if (fp != NULL) {
        fclose(fp);
    }

    return ret;
}

size_t
FileUtil::getFilesize(std::string &path)
{
    size_t ret = 0;
    struct stat st;
    if (stat(path.c_str(), &st) == 0) {
        ret = st.st_size;
    } else {
        std::stringstream ss;
        ss << "file status get failed - " << path << " " << strerror(errno) << "(" << errno << ")";
        err_message = ss.str();
    }

    return ret;
}

int
FileUtil::getDirectoryList(std::list<std::string> &dirlist, std::string &path, bool skip_hide)
{
    int ret = -1;
    DIR *dir;
    struct dirent *entry;

    dirlist.clear();

    dir = opendir(path.c_str());
    if (dir == NULL) {
        std::stringstream ss;
        ss << "file status get failed - " << path << " " << strerror(errno) << "(" << errno << ")";
        err_message = ss.str();
        goto END;
    }

    while ((entry = readdir(dir)) != NULL) {
        if (strcmp(entry->d_name, ".") == 0 || strcmp(entry->d_name, "..") == 0) {
            continue;
        }
        if (strcmp(entry->d_name, "lost+found") == 0) {
            continue;
        }
        if (skip_hide == true && strncmp(entry->d_name, ".", 1) == 0) {
            continue;
        }
        //printf("DIR: %s\n", entry->d_name);
        dirlist.push_back(entry->d_name);
    }

    closedir(dir);
    ret = 0;

END:
    return ret;
}

/**
 * 指定されたpathの種類をチェックする
**/
path_stat
FileUtil::checkPathType(std::string &path)
{
    path_stat result = PATH_NOTFOUND;
    int rc;
    struct stat st;

    rc = stat(path.c_str(), &st);
    if (rc == 0) {
        if (S_ISREG(st.st_mode)) {
            result = PATH_FILE;
        } else if (S_ISDIR(st.st_mode)) {
            result = PATH_DIRECTORY;
        } else if (S_ISCHR(st.st_mode)) {
            result = PATH_CHARDEV;
        } else if (S_ISBLK(st.st_mode)) {
            result = PATH_BLKDEV;
        } else if (S_ISFIFO(st.st_mode)) {
            result = PATH_FIFO;
        }
    }

    return result;
}

bool
FileUtil::isLostFound(std::string &path)
{
    return compareSubDirName(path, "lost+found");
}

/**
 * ディレクトリトラバーサルチェック (".."を含めて予期しないパスのアクセスを防ぐ)
 **/
bool
FileUtil::isTraversalPath(std::string &path)
{
    return compareSubDirName(path, "..");;
}

/**
 * パスを正規化する
**/
void
FileUtil::getCanonicalizePath(std::string &outpath, std::string &path)
{
    std::string::size_type start_pos, end_pos;
    std::string split_name;

    outpath.clear();

    if (path.length() != 0 && path.at(0) == '/') {
        outpath = "/";
    }

    start_pos = 0;
    end_pos = path.find('/');
    while (end_pos != std::string::npos) {
        if (start_pos != end_pos) {
            split_name = path.substr(start_pos, end_pos - start_pos);
            if (split_name.compare(".") != 0) {  // '.' のみは無視する
                outpath.append(split_name);
                outpath.append("/");
            }
        }
        start_pos = end_pos + 1;
        end_pos = path.find('/', start_pos);
    }
    if (start_pos != path.length()) {
        split_name = path.substr(start_pos);
        if (split_name.compare(".") != 0) {  // '.' のみは無視する
            outpath.append(split_name);
        }
    }
}

void
FileUtil::getUpPath(std::string &output, std::string &path)
{
    std::string::size_type start_pos, end_pos;
    std::string ca_path;
    std::string split_name;

    output.clear();

    if ((path.length() == 1 && path.at(0) == '.') || 
        (path.length() > 1 && path.substr(0, 2) == "./"))
    {
        output.insert(output.begin(), '.');
    }

    getCanonicalizePath(ca_path, path);

    if (ca_path.length() > 1) {
        if (ca_path.at(ca_path.length() - 1) == '/') {
            ca_path = ca_path.substr(0, ca_path.length() - 1);
        }

        start_pos = 0;
        end_pos = ca_path.find('/');
        while (end_pos != std::string::npos) {
            split_name = ca_path.substr(start_pos, end_pos - start_pos);
            if (start_pos > 0) {
                output.append("/");
            }
            output.append(split_name);

            start_pos = end_pos + 1;
            end_pos = ca_path.find('/', start_pos);
        }
    }

    if (output.empty() && ca_path.length() != 0 && ca_path.at(0) == '/') {
        output = "/";
    }
}

void
FileUtil::getBasename(std::string &output, std::string &path)
{
    std::string::size_type start_pos, end_pos;
    std::string ca_path;

    output.clear();

    getCanonicalizePath(ca_path, path);

    start_pos = 0;
    end_pos = ca_path.find('/');
    while (end_pos != std::string::npos) {
        start_pos = end_pos + 1;
        end_pos = ca_path.find('/', start_pos);
    }

    output = ca_path.substr(start_pos);
}

