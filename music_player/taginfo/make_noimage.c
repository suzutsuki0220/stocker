#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <errno.h>

int main(int argc, char **argv)
{
    FILE *fp = NULL;
    FILE *header_fp = NULL;
    int c;
    int ret = 1;

    if (argc != 3) {
        fprintf(stderr, "Usage: %s SOURCE_IMAGE noimage.h\n", argv[0]);
        ret = 1;
        goto end;
    }

    const char *noimage_file = argv[1];
    const char *noimage_header = argv[2];

    if ((fp = fopen(noimage_file, "r")) == NULL) {
        fprintf(stderr, "Failed to open %s - %s\n", noimage_file, strerror(errno));
        ret = 1;
        goto end;
    }

    if ((header_fp = fopen(noimage_header, "w")) == NULL) {
        fprintf(stderr, "Failed to open %s - %s\n", noimage_header, strerror(errno));
        ret = 1;
        goto end;
    }

    fprintf(header_fp, "#ifndef __NOIMAGE_H__\n");
    fprintf(header_fp, "#define __NOIMAGE_H__\n");
    fprintf(header_fp, "\n");
    fprintf(header_fp, "const unsigned char noimage_data[] = {");
    
    c = fgetc(fp);
    if (c != EOF) {
        fprintf(header_fp, "%d", c);
        while((c = fgetc(fp)) != EOF) {
            fprintf(header_fp, ",%d", c);
        }
    }
    fprintf(header_fp, "};\n\n");
    fprintf(header_fp, "#endif\n");
    ret = 0;

end:
    if (fp) {
        fclose(fp);
    }

    if (header_fp) {
        fclose(header_fp);
    }

    return ret;
}
