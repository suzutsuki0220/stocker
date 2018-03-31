#include <stdio.h>
#include <string.h>
#include <exif-data.h>
#include <exif-loader.h>

#define TAG_VALUE_BUF 1024

static inline void
remove_bad_chars(char *s)
{
    while (*s) {
        if ((*s == '(') || (*s == ')') || (*s == ' '))
            *s = '_';
        ++s;
    }
}

static void
show_entry_xml(ExifEntry *e, void *data)
{
    char v[TAG_VALUE_BUF], t[TAG_VALUE_BUF];

    strncpy(t, exif_tag_get_title_in_ifd(e->tag, exif_entry_get_ifd(e)), sizeof(t));

    /* Remove invalid characters from tag eg. (, ), space */
    remove_bad_chars(t);

    fprintf(stdout, "\t<0x%04x name=\"%s\">", e->tag, t);
    fprintf(stdout, "%s", exif_entry_get_value (e, v, sizeof (v)));
    fprintf(stdout, "</0x%04x>\n", e->tag);
}

static void
show_xml(ExifData *data)
{
    int i;

    fprintf(stdout, "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n");
    for(i=0; i<EXIF_IFD_COUNT; i++) {
        fprintf(stdout, "<%s>\n", exif_ifd_get_name((ExifIfd)i));
        exif_content_foreach_entry(data->ifd[i], show_entry_xml, NULL);
        fprintf(stdout, "</%s>\n", exif_ifd_get_name((ExifIfd)i));
    }
}

int
main(int argc, char **argv)
{
    char *path = argv[1];
    ExifData *ed = NULL;

    ExifLoader *l;
    l = exif_loader_new();

    exif_loader_write_file(l, path);
    ed = exif_loader_get_data(l);

    if(ed != NULL) {
        /* Show contents of all IFDs */
        show_xml(ed);

        /* output thumbnail */
        // ed->data // thumbnail
        // ed->size // thumbnail image
    }

    exif_loader_unref(l);

    return 0;
}
