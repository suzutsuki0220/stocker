#include <cstdio>
#include <cstdlib>
#include <cstring>
#include <cerrno>
#include <string>
#include <sstream>
#include <stdexcept>  // invalid argument

#include "cgi_util.h"
#include "FileUtil.h"
#include "htmlutil.h"
#include "UrlPath.h"
#include "Range.h"

int
main(int argc, char** argv)
{
    int ret = -1;
    size_t filesize;

    try {
        Range *range  = new Range();
        cgi_util *cgi = new cgi_util();
        FileUtil *fu  = new FileUtil();
        UrlPath  *urlpath = new UrlPath(getenv("STOCKER_CONF"));

        if (cgi->parse_param() != 0) {
            print_400_header(cgi->get_err_message().c_str());
            return -1;
        }

        std::string filepath;
        std::string f_dir  = cgi->get_value("dir");
        std::string f_file = cgi->get_value("file");
        std::string f_mime = cgi->get_value("mime");

        if (f_file.empty() || f_mime.empty()) {
            print_400_header("Invalid parameter");
            return -1;
        }

        f_mime = cgi->decodeFormURL(f_mime);

        if (urlpath->getDecodedPath(filepath, f_dir, f_file) != 0) {
            std::stringstream ss;
            ss << "failed to determine filepath - " << urlpath->getErrorMessage();
            print_400_header(ss.str().c_str());
            return -1;
        }

        filesize = fu->getFilesize(filepath);
        if (filesize == 0 && !fu->get_err_message().empty()) {
            print_400_header(fu->get_err_message().c_str());
            return -1;
        }
        range->set_maxsize(filesize);

        const char *httprange = getenv("HTTP_RANGE");
        if (httprange == NULL) {
            size_t start = 0;
            size_t size = 0;
            char *endptr;

            std::string f_start = cgi->get_value("start");
            std::string f_size  = cgi->get_value("size");

            if (!f_start.empty() && !f_size.empty()) {
                start = strtol(f_start.c_str(), &endptr, 10);
                if (*endptr != '\0') {
                    print_400_header("invalid start parameter");
                    goto END;
                }
                size = strtol(f_size.c_str(), &endptr, 10);
                if (*endptr != '\0') {
                    print_400_header("invalid size parameter");
                    goto END;
                }

                range->add_range(start, size);
            }
        } else {
            if (range->parse(httprange) != 0) {
                print_416_header(range->get_err_message().c_str());
                goto END;
            }
        }

        if (range->get_listsize() == 0) {
            std::string filename, url_encode;
            fu->getBasename(filename, filepath);
            url_encode = cgi->encodeFormURL(filename);

            printf("Content-Type: %s\n", f_mime.c_str());
            printf("Accept-Ranges: bytes\n");
            printf("Content-Length: %zu\n", filesize);
            printf("Content-Disposition: attachment; filename=\"%s\"; filename*=UTF-8''%s\n", filename.c_str(), url_encode.c_str());
            printf("\n");

            ret = fu->readFile(stdout, filepath.c_str(), 0, filesize);
        } else if (range->get_listsize() == 1) {
            printf("Status: 206\n");
            printf("Content-Type: %s\n", f_mime.c_str());
            printf("Accept-Ranges: bytes\n");
            printf("Content-Length: %zu\n", range->get_size(0));
            printf("Content-Range: bytes %zu-%zu/%zu\n", range->get_start(0), range->get_end(0), filesize);
            printf("\n");

            ret = fu->readFile(stdout, filepath.c_str(), range->get_start(0), range->get_size(0));
        } else {
            std::string boundary = "_.oOOo.__.oOOo.__.oOOo.__.oOOo.____.oOOo._";
            std::string ctype_byterange = "Content-Type: multipart/byteranges; boundary=\"" + boundary + "\"";

            size_t contentlength = 0;
            contentlength += (boundary.size() + 4) * range->get_listsize();  // +4 = sizeof("--" + crlf);
            contentlength += boundary.size() + 6;  // +6 = sizeof("--" + "--" + crlf);
            contentlength += (strlen("Content-Type: ") + f_mime.size() + 2) * range->get_listsize();
            contentlength += (strlen("Content-Range: bytes ") + 4) * range->get_listsize();  // +4 = sizeof(crlf + crlf)
            for (int i=0; i<range->get_listsize(); i++) {
                char line[80] = {0};
                snprintf(line, sizeof(line), "%zu-%zu/%zu", range->get_start(i), range->get_end(i), filesize);
                contentlength += strlen(line);
            }
            contentlength += range->get_totalsize() + (2 * range->get_listsize());  // 2 = crlf after contents

            printf("Status: 206\n");
            printf("Content-Type: %s\n", ctype_byterange.c_str());
            printf("Accept-Ranges: bytes\n");
            printf("Content-Length: %zu\n", contentlength);

            for (int i=0; i<range->get_listsize(); i++) {
                printf("\r\n--%s\r\n", boundary.c_str());
                printf("Content-Type: %s\r\n", f_mime.c_str());
                printf("Content-Range: bytes %zu-%zu/%zu\r\n\r\n", range->get_start(i), range->get_end(i), filesize);

                ret = fu->readFile(stdout, filepath.c_str(), range->get_start(i), range->get_size(i));
            }
            printf("\r\n--%s--\r\n", boundary.c_str());
        }
    } catch (std::bad_alloc &ex) {
        fprintf(stderr, "Error: allocation failed : %s\n", ex.what());
        goto END;
    } catch (std::invalid_argument &e) {
        std::stringstream ss;
        ss << "Exception: " << e.what();
        print_400_header(ss.str().c_str());
        goto END;
    }
    ret = 0;

END:
    return ret;
}

