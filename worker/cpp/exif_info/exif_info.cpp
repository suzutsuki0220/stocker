#include <cstdio>
#include <cstring>
#include <sstream>
#include <stdexcept>
#include <libexif/exif-data.h>
#include <libexif/exif-loader.h>

#include "exif_info.h"

#define TAG_VALUE_BUF 1024

std::stringstream entry_ss;

static inline void
remove_bad_chars(char *s)
{
    while (*s)
    {
        if (*s == '"')
            *s = '_';
        ++s;
    }
}

static void
get_entry(ExifEntry *e, void *data)
{
    char v[TAG_VALUE_BUF], t[TAG_VALUE_BUF], tagbuf[32];

    strncpy(t, exif_tag_get_title_in_ifd(e->tag, exif_entry_get_ifd(e)), sizeof(t) - 1);

    /* Remove invalid characters from tag eg. (, ), space */
    remove_bad_chars(t);

    sprintf(tagbuf, "0x%04x", e->tag);
    if (entry_ss.str().length() != 0) {
        entry_ss << ", ";
    }
    entry_ss << "{\"id\": \"" << tagbuf << "\", \"name\": \"" << t << "\", \"value\": \"" << exif_entry_get_value(e, v, sizeof(v)) << "\"}";
}

static void
show_xml(ExifData *data, std::string &result)
{
    int i;
    std::stringstream ss;

    ss.str("");  // stream clear
    ss << "{";
    for (i = 0; i < EXIF_IFD_COUNT; i++)
    {
        if (i != 0) {
            ss << ", ";
        }

        entry_ss.str("");
        ss << "\"" << exif_ifd_get_name((ExifIfd)i) << "\": [";
        exif_content_foreach_entry(data->ifd[i], get_entry, NULL);
        ss << entry_ss.str() << "]";
    }
    ss << ", \"thumbnail\": {";
    ss << "\"size\": " << data->size;
    ss << "}";

    ss << "}";

    result = ss.str();
}

/*
static void
output_thumbnail(ExifData *data)
{
    if (data->size == 0)
    {
        print_400_header("This image does not seem to contain thumbnail");
    }
    else
    {
        fprintf(stdout, "Content-Type: image/jpeg\n");
        fprintf(stdout, "Content-Length: %u\n\n", data->size);

        fwrite(data->data, (size_t)data->size, 1, stdout);
    }
}
*/

void
get_exif(Path_t &decodedPath, std::string &result)
{
    ExifData *ed = NULL;
    ExifLoader *l;

    l = exif_loader_new();

    exif_loader_write_file(l, decodedPath.path.c_str());
    ed = exif_loader_get_data(l);
    if (ed == NULL)
    {
        exif_loader_unref(l);
        throw std::invalid_argument("This image does not seem to contain EXIF data");
    }

    show_xml(ed, result);

    //else if (mode == "thumbnail")
    //{
    //    output_thumbnail(ed);
    //}

    exif_loader_unref(l);
}
