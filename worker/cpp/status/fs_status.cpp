#include <cstdio>
#include <cstdlib>
#include <cstring>
#include <sstream>
#include <string>
#include <sys/statfs.h>
#include <errno.h>
#include <stdexcept>  // invalid argument

#include "htmlutil.h"
#include "cgi_util.h"

static unsigned long
kscale(unsigned long b, unsigned long bs)
{
    return (b * (unsigned long long) bs + 1024/2) / 1024;
}

static float
percent(unsigned long all, unsigned long part)
{
    return ((float)part / (float)all) * 100.0;
}

static void
getFsStatus(const char *path, struct statfs *s)
{
    int ret;

    if (path == NULL || *path == '\0') {
        throw std::invalid_argument("path is not specified");
    }

    ret = statfs(path, s);
    if (ret != 0) {
	char buf[512];
        snprintf(buf, sizeof(buf), "failed to get status: %s - %s(%d)\n", path, strerror(errno), errno);
	throw std::invalid_argument(buf);
    }
}

int
main(int argc, char **argv)
{
    struct statfs s;

    cgi_util *cgi = NULL;
    std::stringstream ss;

    try {
        cgi = new cgi_util();
        if (cgi->parse_param() != 0) {
	    print_400_header(cgi->get_err_message().c_str());
	    return -1;
	}

	std::list<std::string> f_path = cgi->get_values("path");
	std::list<std::string>::iterator f_path_it = f_path.begin();

	if (f_path.size() == 0) {
            throw std::invalid_argument("no path parameters");
	}

        ss << "<\?xml version=\"1.0\" encoding=\"UTF-8\"\?>" << std::endl;
        ss << "<fs_stat>" << std::endl;

	while (f_path_it != f_path.end()) {
	    getFsStatus(f_path_it->c_str(), &s);

	    ss << "<status>"    << std::endl;
	    ss << "  <path>"    << *f_path_it << "</path>" << std::endl;
            ss << "  <total>"   << kscale(s.f_blocks, s.f_bsize) << "</total>" << std::endl;
            ss << "  <use>"     << kscale(s.f_blocks - s.f_bfree, s.f_bsize) << "</use>" << std::endl;
            ss << "  <free>"    << kscale(s.f_bavail, s.f_bsize) << "</free>" << std::endl;
            ss << "  <percent>" << percent(s.f_blocks, s.f_blocks - s.f_bfree) << "</percent>" << std::endl;
	    ss << "</status>"   << std::endl;
	    f_path_it++;
	}

        ss << "</fs_stat>" << std::endl;

        print_200_header("application/xml", ss.str().length(), false);
        fwrite(ss.str().c_str(), ss.str().length(), sizeof(char), stdout);
    } catch (std::bad_alloc ex) {
        fprintf(stderr, "Error: allocation failed : %s\n", ex.what());
        goto DONE;
    } catch (std::invalid_argument e) {
        std::stringstream ss;
        ss << "Exception: " << e.what();
        print_400_header(ss.str().c_str());
        goto DONE;
    }

DONE:
    return 0;
}
