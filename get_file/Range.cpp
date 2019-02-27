#include <cstdio>
#include <cstring>
#include <cassert>

#include "Range.h"

Range::Range(void)
{
    maxsize   = 0;
    totalsize = 0;
    err_message = "";
}

Range::~Range(void)
{

}

int
Range::parse(const char *httprange)
{
    int ret = -1;
    char *dupstr = NULL;
    char *saveptr, *str, *token;
    char *from, *to, *endptr;

    assert(httprange != NULL);
    assert(maxsize > 0);

    if (strlen(httprange) < 6 || strncmp(httprange, "bytes=", 6) != 0) {
        err_message = "Invalid range header";
        goto END;
    }

    dupstr = strdup(httprange + 6);  // skip 6 -> "bytes="
    if (dupstr == NULL) {
        err_message = "allocation failed";
        goto END;
    }

    for (str=dupstr; ; str=NULL) {
        token = strtok_r(str, ",", &saveptr);
        if (token == NULL) {
            break;
        }
	from = token;
	to   = token;
	while(*token != '\0') {
            if (*token == '-') {
                *token = '\0';
		to = token + 1;
		break;
            }
	    token++;
        }
	if (from == to) {
            err_message = "invalid parse string - ";
	    err_message.append(from);
	    goto END;
	}

	length len;
        if (strlen(from) == 0) {
            len.start = 0;
        } else {
            len.start = (size_t)strtol(from, &endptr, 10);
            if (from == endptr) {
                err_message = "invalid start point, no digits?";
                goto END;
            }
            if (*endptr != '\0') {
                err_message = "invalid value at start point - ";
                err_message.append(endptr);
                goto END;
            }
        }

        if (strlen(to) == 0) {
            len.end = maxsize - 1;
        } else {
            len.end = (size_t)strtol(to, &endptr, 10);
            if (to == endptr) {
                err_message = "invalid end point, no digits?";
                goto END;
            }
            if (*endptr != '\0') {
                err_message = "invalid value at end point - ";
                err_message.append(endptr);
                goto END;
            }
        }

        if (len.start > len.end) {
            err_message = "funny range. start is bigger than end";
            goto END;
        }
        if (len.end > maxsize) {
            err_message = "range over the maxsize";
            goto END;
        }
        if (totalsize > maxsize * 3) {  // prevent DoS attack
            err_message = "too many ranges";
            goto END;
        }

        len.size = len.end - len.start + 1;
	totalsize += len.size;

	//fprintf(stderr, "DEBUG: start=%d, end=%d, size=%d\n", len.start, len.end, len.size);

        length_list.push_back(len);
    }
    ret = 0;

END:
    if (dupstr) {
        free(dupstr);
    }

    if (ret != 0) {
        length_list.clear();
    }

    return ret;
}

void
Range::set_maxsize(size_t maxsize)
{
    this->maxsize = maxsize;
}

int
Range::add_range(size_t start, size_t size)
{
    length len;
    len.start = start;
    len.size  = size;
    len.end   = start + size;
    if (len.end > maxsize) {
        err_message = "add range over the maxsize";
        return -1;
    }

    this->length_list.push_back(len);
    return 0;
}

size_t
Range::get_totalsize(void)
{
    return this->totalsize;
}

size_t
Range::get_start(int index)
{
    return this->length_list[index].start;
}

size_t
Range::get_end(int index)
{
    return this->length_list[index].end;
}

size_t
Range::get_size(int index)
{
    return this->length_list[index].size;
}

int
Range::get_listsize(void)
{
    return this->length_list.size();
}

std::string
Range::get_err_message(void)
{
    return err_message;
}
