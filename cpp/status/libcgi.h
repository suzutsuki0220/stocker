#ifndef __LIBCGI_H__
#define __LIBCGI_H__

#ifdef __cplusplus
extern "C" {
#endif

void cgi_header(const char *ctype);
void cgi_error_header(const int status, const char *message);
int cgi_get_form(const char *name, const char *value);

#ifdef __cplusplus
}
#endif

#endif // __LIBCGI_H__
