#include <cstdio>
#include <cstring>
#include <sstream>
#include <exif-data.h>
#include <exif-loader.h>

#include "htmlutil.h"
#include "cgi_util.h"
#include "UrlPath.h"
#include "Config.h"

#define TAG_VALUE_BUF 1024

#ifndef CONFDIR
#define CONFDIR "/var/www/stocker/conf"
#endif

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

    fprintf(stdout, "\t<data id=\"0x%04x\" name=\"%s\">", e->tag, t);
    fprintf(stdout, "%s", exif_entry_get_value (e, v, sizeof (v)));
    fprintf(stdout, "</data>\n");
}

static void
show_xml(ExifData *data)
{
    int i;

    fprintf(stdout, "Content-Type: application/xml\n\n");
    fprintf(stdout, "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n");
    fprintf(stdout, "<exif_info>\n");
    for(i=0; i<EXIF_IFD_COUNT; i++) {
        fprintf(stdout, "<group name=\"%s\">\n", exif_ifd_get_name((ExifIfd)i));
        exif_content_foreach_entry(data->ifd[i], show_entry_xml, NULL);
        fprintf(stdout, "</group>\n");
    }
    fprintf(stdout, "<thumbnail>\n");
    fprintf(stdout, "\t<size>%u</size>\n", data->size);
    fprintf(stdout, "</thumbnail>\n");
    fprintf(stdout, "</exif_info>\n");
}

static void
output_thumbnail(ExifData *data)
{
    if (data->size == 0) {
        print_400_header("This image does not seem to contain thumbnail");
    } else {
        fprintf(stdout, "Content-Type: image/jpeg\n");
        fprintf(stdout, "Content-Length: %u\n\n", data->size);

        fwrite(data->data, (size_t)data->size, 1, stdout);
    }
}

int
main(int argc, char **argv)
{
    int ret = -1;
    cgi_util *cgi = NULL;
    UrlPath  *urlpath = NULL;
    std::string filepath, f_mode;

    ExifData *ed = NULL;
    ExifLoader *l;

    try {
        cgi = new cgi_util();
        if (cgi->parse_param() != 0) {
            print_400_header(cgi->get_err_message().c_str());
            return -1;
        }

        urlpath = new UrlPath(CONFDIR);

        std::string f_dir  = cgi->get_value("dir");
        std::string f_file = cgi->get_value("file");
        f_mode = cgi->get_value("mode");

        f_dir = cgi->decodeFormURL(f_dir);

        if (urlpath->getDecodedPath(filepath, f_dir, f_file) != 0) {
            print_400_header("failed to determine filepath");
            return -1;
        }

        f_mode = cgi->decodeFormURL(f_mode);
    } catch (std::bad_alloc ex) {
        fprintf(stderr, "Error: allocation failed : %s\n", ex.what());
        goto END;
    } catch (std::invalid_argument e) {
        std::stringstream ss;
        ss << "Exception: " << e.what();
        print_400_header(ss.str().c_str());
        goto END;
    }

    l = exif_loader_new();

    exif_loader_write_file(l, filepath.c_str());
    ed = exif_loader_get_data(l);

    if(ed == NULL) {
        print_400_header("This image does not seem to contain EXIF data");
    } else {
        if (f_mode.empty() || f_mode == "exif") {
            show_xml(ed);
        } else if (f_mode == "thumbnail") {
            output_thumbnail(ed);
        }
    }
    exif_loader_unref(l);

    ret = 0;

END:
    return ret;
}
