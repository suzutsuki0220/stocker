#include <cstdio>
#include <cstdlib>
#include <cstring>
#include <sstream>
#include <string>
#include <sys/sysinfo.h>
#include <errno.h>
#include <unistd.h>
#include <fcntl.h>  // open
#include <stdexcept>  // invalid argument

#include "htmlutil.h"
//#include "cgi_util.h"

//#define USE_SYSINFO_CALL

static unsigned long long
kscale(unsigned long d, unsigned long long unit)
{
    const unsigned long long mem_unit = unit ? unit : 1;
#ifdef USE_SYSINFO_CALL
    const unsigned unit_steps = 10;  // 2^10 (kilobyte scale)
#else
    const unsigned unit_steps = 0;   // kernel tells kilibyte scale
#endif

    return ((unsigned long long)d * mem_unit) >> unit_steps;
}

static float
percent(unsigned long all, unsigned long part)
{
    return ((float)part / (float)all) * 100.0;
}

#ifdef USE_SYSINFO_CALL
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
#else

#define MEMINFO_FILE "/proc/meminfo"

#define FILE_TO_BUF(filename, fd) do{                           \
    static int local_n;                                         \
    if (fd == -1 && (fd = open(filename, O_RDONLY)) == -1) {    \
        fflush(NULL);                                           \
        throw std::invalid_argument("BAD_OPEN_MESSAGE");        \
    }                                                           \
    lseek(fd, 0L, SEEK_SET);                                    \
    if ((local_n = read(fd, buf, sizeof buf - 1)) < 0) {        \
        fflush(NULL);                                           \
	char buf[512];                                          \
        snprintf(buf, sizeof(buf), "failed to get status: %s(%d)\n", strerror(errno), errno); \
	throw std::invalid_argument(buf);                       \
    }                                                           \
    buf[local_n] = '\0';                                        \
}while(0)

typedef struct mem_table_struct {
    const char *name;     /* memory type name */
    unsigned long *slot; /* slot in return struct */
} mem_table_struct;

static int compare_mem_table_structs(const void *a, const void *b){
    return strcmp(((const mem_table_struct*)a)->name,((const mem_table_struct*)b)->name);
}

static void
getMemStatus(struct sysinfo *s)
{
    char buf[8192];
    char *head, *tail;

    char namebuf[32]; /* big enough to hold any row name */
    int meminfo_fd = -1;
    mem_table_struct findme = { namebuf, NULL };
    mem_table_struct *found; 

    unsigned long kb_main_buffers;
    unsigned long kb_page_cache;
    unsigned long kb_main_free;
    unsigned long kb_main_total;
    unsigned long kb_main_shared;
    unsigned long kb_slab;
    unsigned long kb_swap_free;
    unsigned long kb_swap_total;

    static const mem_table_struct mem_table[] = {
    {"Buffers",      &kb_main_buffers},
    {"Cached",       &kb_page_cache},
    {"MemFree",      &kb_main_free},
    {"MemTotal",     &kb_main_total},
    {"Shmem",        &kb_main_shared},  // kernel 2.6.32 and later
    {"Slab",         &kb_slab},         // kB version of vmstat nr_slab
    {"SwapFree",     &kb_swap_free},
    {"SwapTotal",    &kb_swap_total},
    };
    const size_t mem_table_count = sizeof(mem_table)/sizeof(mem_table_struct);

    FILE_TO_BUF(MEMINFO_FILE, meminfo_fd);

    head = buf;
    while((tail = strchr(head, ':')) != NULL) {
        *tail = '\0';
	if (strlen(head) >= sizeof(namebuf)) {
	    head = tail + 1;
	    goto nextline;
	}
	strcpy(namebuf, head);
	found = (mem_table_struct*)bsearch((void*)&findme, (void*)mem_table, mem_table_count, sizeof(mem_table_struct), compare_mem_table_structs);
	head = tail + 1;
	if (!found) goto nextline;
	*(found->slot) = (unsigned long)strtoull(head, &tail, 10);
nextline:
	tail = strchr(head, '\n');
	if (tail == NULL) break;
	head = tail + 1;
    }

    s->totalram  = kb_main_total;
    s->freeram   = kb_main_free;
    s->sharedram = kb_main_shared;
    s->bufferram = kb_main_buffers;
    s->totalswap = kb_swap_total;
    s->freeswap  = kb_swap_free;

    s->freehigh  = kb_page_cache + kb_slab;  // Cache

    s->mem_unit = 1UL;
}
#endif

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

	ss << "<mem>"  << std::endl;
        ss << "  <total>"   << kscale(s.totalram, s.mem_unit) << "</total>" << std::endl;
#ifdef USE_SYSINFO_CALL
        ss << "  <used>"    << kscale(s.totalram - s.freeram, s.mem_unit) << "</used>" << std::endl;
#else
        ss << "  <used>"    << kscale(s.totalram - s.freeram - s.freehigh - s.bufferram, s.mem_unit) << "</used>" << std::endl;
#endif
        ss << "  <free>"    << kscale(s.freeram, s.mem_unit) << "</free>" << std::endl;
#ifndef USE_SYSINFO_CALL
        ss << "  <cache>"   << kscale(s.freehigh, s.mem_unit) << "</cache>" << std::endl;
#endif
        ss << "  <shared>"  << kscale(s.sharedram, s.mem_unit) << "</shared>" << std::endl;
        ss << "  <buffers>" << kscale(s.bufferram, s.mem_unit) << "</buffers>" << std::endl;
	ss << "</mem>"  << std::endl;

#ifndef USE_SYSINFO_CALL
	ss << "<swap>"  << std::endl;
        ss << "  <total>"   << kscale(s.totalswap, s.mem_unit) << "</total>" << std::endl;
        ss << "  <used>"    << kscale(s.totalswap - s.freeswap, s.mem_unit) << "</used>" << std::endl;
        ss << "  <free>"    << kscale(s.freeswap, s.mem_unit) << "</free>" << std::endl;
	ss << "</swap>"  << std::endl;
#endif
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
