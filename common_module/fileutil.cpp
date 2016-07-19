#include <cstdio>
#include <cstring>
#include <cerrno>
#include <sys/stat.h>
#include <string>
#include <sstream>

#include "fileutil.h"

fileutil::fileutil(const char *file)
{
    this->file = file;
    this->err_message = "";
}

fileutil::~fileutil()
{

}

std::string
fileutil::get_err_message(void)
{
    return this->err_message;
}

int 
fileutil::output_data(FILE *out_fp, size_t start, size_t size)
{
    int ret = -1;
    FILE *fp = NULL;
    char buff[BUFSIZ];

    fp = fopen(file, "r");
    if(fp == NULL) {
	err_message = "file open failed - ";
	err_message += file;
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
                fprintf(stderr, "read file reached EOF, size parameter is bigger than filesize? - start=%zu, size=%zu, read=%zu", start, size, size-remain);
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
fileutil::get_filesize(void)
{
    size_t ret = 0;
    struct stat st;
    if (stat(file, &st) == 0) {
        ret = st.st_size;
    } else {
	std::stringstream ss;
	ss << "file status get failed - " << strerror(errno) << "(" << errno << ")";
        err_message = ss.str();
    }

    return ret;
}

