#include <cstdio>
#include <cstdlib>
#include <cstring>
#include <cerrno>
#include <string>
#include <sstream>
#include <stdexcept>  // invalid argument
#include <list>
#include <sys/stat.h>
#include <ctime>

#include "cgi_util.h"
#include "FileUtil.h"
#include "htmlutil.h"
#include "UrlPath.h"

#ifndef CONFDIR
#define CONFDIR "/var/www/stocker/conf"
#endif

#define NUM_PARAM_NO_SET -1

static void
getTimeString(std::string &timestr, time_t time)
{
    char buf[256];
    struct tm t;

    localtime_r(&time, &t);
    snprintf(buf, sizeof(buf), "%02d/%02d/%02d %02d:%02d",
	    t.tm_year >= 100 ? t.tm_year - 100 : t.tm_year,
	    t.tm_mon + 1,
	    t.tm_mday,
	    t.tm_hour,
	    t.tm_min
	    );

    timestr = buf;
}

static inline void
makePropertiesTag(std::stringstream &ss, FileUtil *fileutil, UrlPath *urlpath, cgi_util *cgi, std::string &path, size_t elements)
{
    std::string decoded_path;
    std::string encoded_uppath, basename, updir;

    urlpath->decode(decoded_path, path);

    fileutil->getBasename(basename, decoded_path);
    fileutil->getUpPath(updir, decoded_path);
    urlpath->encode(encoded_uppath, updir);

    ss << "  <properties>" << std::endl;
    ss << "    <name>" << cgi->escapeHtml(basename) << "</name>" << std::endl;
    ss << "    <elements>" << elements << "</elements>" << std::endl;
    ss << "    <up_path>" << encoded_uppath << "</up_path>" << std::endl;
    ss << "    <up_dir>" << cgi->escapeHtml(updir) << "</up_dir>" << std::endl;
    ss << "  </properties>" << std::endl;
}

static inline void
makeElementTag(std::stringstream &ss, FileUtil *fileutil, UrlPath *urlpath, cgi_util *cgi, std::string &p_path, std::string &path, const int num, std::string &name)
{
    size_t filesize;
    std::string elem_type;
    std::string lastmodified;
    std::string decoded_path, encoded;
    struct stat st;

    // 実際にアクセスする為のフルパス
    std::string filepath = p_path;
    filepath.append("/");
    filepath.append(name);

    // パラメータ用パス
    urlpath->decode(decoded_path, path);
    decoded_path.append("/");
    decoded_path.append(name);
    urlpath->encode(encoded, decoded_path);

    if (stat(filepath.c_str(), &st) == 0) {
	if (S_ISDIR(st.st_mode)) {
	    std::list<std::string> li;
	    elem_type = "DIRECTORY";
	    fileutil->getDirectoryList(li, filepath);
	    filesize = li.size();  // ディレクトリの場合はその中身の数
	} else {
	    elem_type = "FILE";
	    filesize  = st.st_size;
	}
	getTimeString(lastmodified, st.st_mtime);
    } else {
	filesize = 0;
	elem_type = "ERROR";
	lastmodified = "";
    }

    ss << "    <element>" << std::endl;
    ss << "      <name>" << cgi->escapeHtml(name) << "</name>" << std::endl;
    ss << "      <path>" << encoded << "</path>" << std::endl;
    ss << "      <type>" << elem_type << "</type>" << std::endl;
    ss << "      <size>" << filesize << "</size>" << std::endl;
    ss << "      <last_modified>" << lastmodified << "</last_modified>" << std::endl;
    ss << "      <num>" << num << "</num>" << std::endl;
    ss << "    </element>" << std::endl;
}

int
main(int argc, char** argv)
{
    int ret = -1;
    char *endptr;
    std::list<std::string> entries;

    try {
	std::stringstream ss;
        cgi_util *cgi = new cgi_util();
        FileUtil *fileutil = new FileUtil();
        UrlPath  *urlpath  = new UrlPath(CONFDIR);
	int from = NUM_PARAM_NO_SET;
	int to   = NUM_PARAM_NO_SET;

	size_t elements;
	path_stat type;

        if (cgi->parse_param() != 0) {
            print_400_header(cgi->get_err_message().c_str());
            return -1;
        }

        std::string p_path;
        std::string f_dir  = cgi->get_value("dir");
        std::string f_file = cgi->get_value("file");
        std::string f_from = cgi->get_value("from");
        std::string f_to   = cgi->get_value("to");

        if (f_dir.empty()) {
            print_400_header("Invalid parameter");
            return -1;
        }

	if (urlpath->getDecodedPath(p_path, f_dir, f_file) != 0) {
	    ss << "failed to determine filepath - " << urlpath->getErrorMessage();
            print_400_header(ss.str().c_str());
            return -1;
        }

	if (!f_from.empty()){
	    from = strtol(f_from.c_str(), &endptr, 10);
	    if (*endptr != '\0') {
		print_400_header("Invalid parameter [from]");
		return -1;
	    }
	}
	if (!f_to.empty()) {
	    to = strtol(f_to.c_str(), &endptr, 10);
	    if (*endptr != '\0') {
		print_400_header("Invalid parameter [to]");
		return -1;
	    }
	}
 
	type = fileutil->checkPathType(p_path);
	if (type == PATH_NOTFOUND) {
	    ss << "failed to open filepath - " << urlpath->getErrorMessage();
            print_400_header(ss.str().c_str());
            return -1;
	} else if (type == PATH_DIRECTORY) {
	    fileutil->getDirectoryList(entries, p_path);
            elements = entries.size();
	    entries.sort();
	} else {
	    // file or etc.
	    entries.clear();
            elements = 1;
	}

	ss << "<?xml version=\"1.0\" encoding=\"UTF-8\"?>" << std::endl;
        ss << "<directory>" << std::endl;

	makePropertiesTag(ss, fileutil, urlpath, cgi, f_file, elements);

	if (!entries.empty()) {
	    auto itr = entries.begin();
	    int num;

	    ss << "  <contents>" << std::endl;
	    num = 0;
	    while(itr != entries.end()) {
		if (from == NUM_PARAM_NO_SET || from <= num) {
		    if (to == NUM_PARAM_NO_SET || num <= to) {
			makeElementTag(ss, fileutil, urlpath, cgi, p_path, f_file, num, *itr);
		    }
		}
		num++;
		itr++;
	    }
	    ss << "  </contents>" << std::endl;
	}

	ss << "</directory>" << std::endl;

	print_200_header("application/xml", ss.str().length());
	fwrite(ss.str().c_str(), ss.str().length(), sizeof(char), stdout);
    } catch (std::bad_alloc ex) {
        fprintf(stderr, "Error: allocation failed : %s\n", ex.what());
        goto END;
    } catch (std::invalid_argument e) {
        std::stringstream ss;
        ss << "Exception: " << e.what();
        print_400_header(ss.str().c_str());
        goto END;
    }
    ret = 0;

END:
    return ret;
}

