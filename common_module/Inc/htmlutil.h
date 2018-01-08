#ifndef __HTML_UTIL_H__
#define __HTML_UTIL_H__

void print_200_header(const char *ctype, size_t clength, bool range = true);
void print_400_header(const char *message);
void print_416_header(const char *message);

#endif // __HTML_UTIL_H__

