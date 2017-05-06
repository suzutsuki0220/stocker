#include <cstdio>
#include <cstdlib>
#include <cstring>
#include <sstream>
#include <string>
#include <sys/sysinfo.h>
#include <errno.h>
#include <stdexcept>  // invalid argument

#include "htmlutil.h"
//#include "cgi_util.h"

static unsigned long long
kscale(unsigned long d, unsigned long long unit)
{
    const unsigned long long mem_unit = unit ? unit : 1;
    const unsigned unit_steps = 10;  // 2^10 (kilobyte scale)

    return ((unsigned long long)d * mem_unit) >> unit_steps;
}

static float
percent(unsigned long all, unsigned long part)
{
    return ((float)part / (float)all) * 100.0;
}

static void
getMemStatus(struct sysinfo *s)
{
    int ret;

    ret = sysinfo(s);
    if (ret != 0) {
	char buf[512];
        snprintf(buf, sizeof(buf), "failed to get status: %s(%d)\n", strerror(errno), errno);
	throw std::invalid_argument(buf);
    }
}

int
main(int argc, char **argv)
{
    struct sysinfo s;

//    cgi_util *cgi = NULL;
    std::stringstream ss;

    try {
//        cgi = new cgi_util();
//        if (cgi->parse_param() != 0) {
//	    print_400_header(cgi->get_err_message().c_str());
//	    return -1;
//	}

        ss << "<\?xml version=\"1.0\" encoding=\"UTF-8\"\?>" << std::endl;

	getMemStatus(&s);

	ss << "<mem_stat>"  << std::endl;
        ss << "  <total>"   << kscale(s.totalram, s.mem_unit) << "</total>" << std::endl;
        ss << "  <used>"    << kscale(s.totalram - s.freeram, s.mem_unit) << "</used>" << std::endl;
        ss << "  <free>"    << kscale(s.freeram, s.mem_unit) << "</free>" << std::endl;
        ss << "  <shared>"  << kscale(s.sharedram, s.mem_unit) << "</shared>" << std::endl;
        ss << "  <buffers>" << kscale(s.bufferram, s.mem_unit) << "</buffers>" << std::endl;
	ss << "</mem_stat>" << std::endl;


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
