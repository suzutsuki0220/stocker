#include <cstdio>
#include <cstdlib>
#include <cstring>
#include <cerrno>
#include <string>
#include <sstream>
#include <stdexcept>  // invalid argument
#include <list>

#include "cgi_util.h"
#include "FileUtil.h"
#include "htmlutil.h"
#include "UrlPath.h"

#ifndef CONFDIR
#define CONFDIR "/var/www/stocker/conf"
#endif

int
main(int argc, char** argv)
{
    int ret = -1;
    std::list<std::string> entries;

    try {
	std::stringstream ss;
        cgi_util *cgi = new cgi_util();
        FileUtil *fileutil = new FileUtil();
        UrlPath  *urlpath  = new UrlPath(CONFDIR);

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
	ss << "  <properties>" << std::endl;
	ss << "    <name>" << "</name>" << std::endl;
	ss << "    <elements>" << elements << "</elements>" << std::endl;
	ss << "    <up_path>" << "</up_path>" << std::endl;
	ss << "    <up_dir>" << "</up_dir>" << std::endl;
	ss << "  </properties>" << std::endl;

	if (!entries.empty()) {
	    size_t filesize;
	    std::string elem_type;
	    auto itr = entries.begin();
	    int num = 0;

	    ss << "  <contents>" << std::endl;
	    while(itr != entries.end()) {
		std::string encoded;
		std::string filepath = p_path;
		filepath.append("/");
		filepath.append(*itr);

		filesize = fileutil->getFilesize(filepath);
		elem_type = fileutil->checkPathType(filepath) == PATH_DIRECTORY ? "DIRECTORY" : "FILE";
		urlpath->encode(encoded, filepath);


		ss << "    <element>" << std::endl;
		ss << "      <name>" << *itr << "</name>" << std::endl;
		ss << "      <path>" << encoded << "</path>" << std::endl;
		ss << "      <type>" << elem_type << "</type>" << std::endl;
		ss << "      <size>" << filesize << "</size>" << std::endl;
		ss << "      <last_modified>" << "</last_modified>" << std::endl;
		ss << "      <num>" << num << "</num>" << std::endl;
		ss << "    </element>" << std::endl;

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

