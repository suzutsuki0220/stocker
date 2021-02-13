#include <cstdio>
#include <cstdlib>
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
set_result(ExifData *data, std::string &result)
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

    set_result(ed, result);

    exif_loader_unref(l);
}

void
get_exif_thumbnail(Path_t &decodedPath, response_buffer_t &result)
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

    result.size = (uint32_t)ed->size;
    strcpy(result.mime_type, "image/jpeg");
    if (result.size != 0) {
        result.byte = (char*)malloc((size_t)ed->size);
        if (result.byte == NULL) {
            throw std::bad_alloc();
        }
        memcpy(result.byte, ed->data, (size_t)ed->size);
    } else {
        result.byte = NULL;
    }

    exif_loader_unref(l);
}
