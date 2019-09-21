#include <cstdio>
#include <cstdlib>
#include <cstring>
#include <unistd.h>
#include <errno.h>

#include "libcgi.h"

void cgi_header(const char *ctype)
{
    printf("Content-Type: %s\r\n", ctype);
    printf("\r\n");
}

void cgi_error_header(const int status, const char *message)
{
    printf("Status: %d\n\n", status);
    printf("%s\n", message);
}

int cgi_get_form(const char *name, const char *value)
{
    int ret = 0;  /* 0: not found, 1: found */
    const char *method;
    const char *query;

    /* REQUEST_METHOD (GET or POST) */
    method = getenv("REQUEST_METHOD");
    if (method == NULL) {
printf("method env not found");
        return ret;
    }

    if (strcmp(method, "POST") == 0) {
        char buf[10] = {0};
        const char *clen;
	char *clen_end;
	long long remain_len;

        clen = getenv("CONTENT_LENGTH");
        if (clen == NULL) {
printf("CONTENT_LENGTH is not found\n");
            return ret;
        }
	remain_len = strtoll(clen, &clen_end, 10);

printf("Method: POST\n");
        /* stdin */
        while(remain_len > 0) {
            size_t read_len;
	    size_t s = (long long)sizeof(buf) > remain_len ? (size_t)remain_len : sizeof(buf) -1;
            read_len = read(fileno(stdin), buf, s);
	    if (read_len < 0) {
                if (errno == EINTR) {
		    continue;
		}
		fprintf(stderr, "failed to read - %s(%d)", strerror(errno), errno);
		goto end;
	    } else if (read_len == 0) {
		break;
	    }
printf("Query buf: %s\n", buf);
            memset(buf, '\0', sizeof(buf));
	    remain_len -= (long long)read_len;
        }
    } else {
printf("Method: GET\n");
        /* QUERY_STRING */
        query = getenv("QUERY_STRING");
        if (query) {
printf("Query: %s\n", query);
        }
    }

end:

    return ret;
}
