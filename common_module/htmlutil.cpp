#include <stdio.h>

void
print_200_header(const char *ctype, size_t clength)
{
    printf("Content-Type: %s\n", ctype);
    printf("Accept-Ranges: bytes\n");
    printf("Content-Length: %zu\n", clength);
    printf("\n");
}

/** Bad Request **/
void
print_400_header(const char *message)
{
    printf("Status: 400\n\n");
    printf("%s\n", message);
    fprintf(stderr, "%s\n", message);
}

/** Range Not Satisfiable **/
void
print_416_header(const char *message)
{
    printf("Status: 416\n\n");
    printf("%s\n", message);
    fprintf(stderr, "%s\n", message);
}
