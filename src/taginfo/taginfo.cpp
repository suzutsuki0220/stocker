/* Copyright (C) 2016 suzutsuki0220 <suzutsuki0220@gmail.com>
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 *
 * 1. Redistributions of source code must retain the above copyright
 *    notice, this list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright
 *    notice, this list of conditions and the following disclaimer in the
 *    documentation and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY THE AUTHOR ``AS IS'' AND ANY EXPRESS OR
 * IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
 * OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
 * IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY DIRECT, INDIRECT,
 * INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT
 * NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
 * THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

#include <iostream>
#include <iomanip>
#include <iconv.h>
#include <cstdio>
#include <string>
#include <sstream>
#include <stdexcept>  // invalid argument

#include <taglib/fileref.h>
#include <taglib/tag.h>
#include <taglib/tpropertymap.h>
#include <taglib/flacfile.h>
#include <taglib/asffile.h>
#include <taglib/mpegfile.h>
#include <taglib/mp4file.h>
#include <taglib/id3v2tag.h>

#include "noimage.h"
#include "htmlutil.h"
#include "cgi_util.h"
#include "UrlPath.h"
#include "Config.h"

using namespace std;

#ifndef CONFDIR
#define CONFDIR "/var/www/stocker/conf"
#endif

#define MYBUFSZ 1024
void
conv(string &str)
{
    iconv_t ic;
    char    str_out[MYBUFSZ+1];
    char *ptr_in  = (char*)str.c_str();
    size_t  ptr_in_size = str.size();
    char    *ptr_out = str_out;
    size_t  mybufsz = (size_t) MYBUFSZ;

    ic = iconv_open("UTF-8", "UTF-16");
    iconv(ic, &ptr_in, &ptr_in_size, &ptr_out, &mybufsz);
    iconv_close(ic);

    str = ptr_out;
}

int
outputAudioTags(cgi_util *cgi, TagLib::FileRef &f)
{
    if (f.isNull() || !f.tag()) {
        print_400_header("invalid file reference");
        return -1;
    }

    std::stringstream ss;
    TagLib::Tag *tag = f.tag();

    std::string title, artist, album, comment, genre;
    title   = tag->title().to8Bit(true);
    artist  = tag->artist().to8Bit(true);
    album   = tag->album().to8Bit(true);
    comment = tag->comment().to8Bit(true);
    genre   = tag->genre().to8Bit(true);

     //string title = tag->title().toCString();
     //conv(title);

    ss << "<?xml version=\"1.0\" encoding=\"UTF-8\"?>" << endl;
    ss << "<tag>" << endl;
    ss << "  <title>"   << cgi->escapeHtml(title)   << "</title>"   << endl;
    ss << "  <artist>"  << cgi->escapeHtml(artist)  << "</artist>"  << endl;
    ss << "  <album>"   << cgi->escapeHtml(album)   << "</album>"   << endl;
    ss << "  <year>"    << tag->year()              << "</year>"    << endl;
    ss << "  <comment>" << cgi->escapeHtml(comment) << "</comment>" << endl;
    ss << "  <track>"   << tag->track()             << "</track>"   << endl;
    ss << "  <genre>"   << cgi->escapeHtml(genre)   << "</genre>"   << endl;

    if (f.audioProperties()) {
        TagLib::AudioProperties *properties = f.audioProperties();
        int seconds = properties->length() % 60;
        int minutes = (properties->length() - seconds) / 60;

        ss << "  <bitrate>"     << properties->bitrate()    << "</bitrate>"     << endl;
        ss << "  <sample_rate>" << properties->sampleRate() << "</sample_rate>" << endl;
        ss << "  <channels>"    << properties->channels()   << "</channels>"    << endl;
        ss << "  <duration>" << properties->length() << "</duration>"    << endl;
        ss << "  <time>" << minutes << ":" << setfill('0') << setw(2) << seconds << "</time>" << endl;
    }

    ss << "</tag>" << endl;

    if (ss.str().empty()) {
        print_400_header("failed to get tag properties");
        return -1;
    } else {
        print_200_header("application/xml", ss.str().length());
        fwrite(ss.str().c_str(), ss.str().length(), sizeof(char), stdout);
    }

    return 0;
}

int
outputPicture(TagLib::FileRef &f)
{
    const char *mimetype;
    TagLib::ByteVector bytevector;

    if(f.isNull()) {
        print_400_header("invalid file reference");
        return -1;
    }

    if(dynamic_cast<TagLib::FLAC::File*>(f.file())) {
        TagLib::FLAC::File *file = dynamic_cast<TagLib::FLAC::File*>(f.file());
        const TagLib::List<TagLib::FLAC::Picture*>& picList = file->pictureList();
        if (! picList.isEmpty()) {
            TagLib::FLAC::Picture *pic = picList[0];
            mimetype   = pic->mimeType().toCString(false);
            bytevector = pic->data();
        }
    } else if (dynamic_cast<TagLib::ASF::File*>(f.file())) {
        TagLib::ASF::File *file = dynamic_cast<TagLib::ASF::File*>(f.file());
        if (! file->tag()->isEmpty()) {
            const TagLib::ASF::AttributeListMap& attrListMap = file->tag()->attributeListMap();
            const TagLib::ASF::AttributeList& attrList = attrListMap["WM/Picture"];
            if (! attrList.isEmpty()) {
                TagLib::ASF::Picture pic = attrList[0].toPicture();
                if (pic.isValid()) {
                    mimetype   = pic.mimeType().toCString(false);
                    bytevector = pic.picture();
                }
            }
        }
    } else if (dynamic_cast<TagLib::MPEG::File*>(f.file())) {
        TagLib::MPEG::File *file = dynamic_cast<TagLib::MPEG::File*>(f.file());
        if (file->ID3v2Tag()) {
            const TagLib::ID3v2::FrameList l = file->ID3v2Tag()->frameListMap()["APIC"];
            if (! l.isEmpty()) {
                TagLib::ID3v2::Frame *f = l.front();
                TagLib::ByteVector d = f->render();
                if (! d.isNull()) {
                    TagLib::ID3v2::AttachedPictureFrame *apf = new TagLib::ID3v2::AttachedPictureFrame(d);
                    mimetype   = apf->mimeType().toCString(false);
                    bytevector = apf->picture();
                }
            }
        }
    } else if (dynamic_cast<TagLib::MP4::File*>(f.file())) {
        TagLib::MP4::File *file = dynamic_cast<TagLib::MP4::File*>(f.file());
        if (file->tag()) {
            //TagLib::MP4::Item item = file->tag()->item("covr");
            std::string key = "covr";
            TagLib::MP4::ItemListMap itemList = file->tag()->itemListMap();
            TagLib::MP4::Item item = itemList[key];
            if (item.isValid()) {
                TagLib::MP4::CoverArt coverart = item.toCoverArtList().front();
                switch (coverart.format()) {
                case TagLib::MP4::CoverArt::JPEG:
                    mimetype = "image/jpeg";
                    break;
                case TagLib::MP4::CoverArt::PNG:
                    mimetype = "image/png";
                    break;
                case TagLib::MP4::CoverArt::BMP:
                    mimetype = "image/bmp";
                    break;
                case TagLib::MP4::CoverArt::GIF:
                    mimetype = "image/gif";
                    break;
                default:
                    mimetype = "application/octet-stream";
                    break;
                }
                bytevector = coverart.data();
            }
        }
    }

    if (bytevector.isNull() || bytevector.size() == 0) {
        mimetype = "image/png";
        print_200_header(mimetype, sizeof(noimage_data));
        fwrite(noimage_data, sizeof(noimage_data), sizeof(char), stdout);
    } else {
        print_200_header(mimetype, (size_t)bytevector.size());
        fwrite(bytevector.data(), (size_t)bytevector.size(), sizeof(char), stdout);
    }

    return 0;
}

int
main(int argc, char *argv[])
{
    int ret = -1;

    try {
        cgi_util *cgi = new cgi_util();
        if (cgi->parse_param() != 0) {
            print_400_header(cgi->get_err_message().c_str());
            return -1;
        }

        UrlPath *urlpath = new UrlPath(getenv("STOCKER_CONF"));

        std::string filepath;
        std::string f_dir  = cgi->get_value("dir");
        std::string f_file = cgi->get_value("file");
        std::string f_mode = cgi->get_value("mode");

        f_dir = cgi->decodeFormURL(f_dir);

        if (urlpath->getDecodedPath(filepath, f_dir, f_file) != 0) {
            print_400_header("failed to determine filepath");
            return -1;
        }

        f_mode = cgi->decodeFormURL(f_mode);

        //fprintf(stderr, "DEBUG: file [%s]\n", filepath.c_str());

        TagLib::FileRef f(filepath.c_str());

        if (f_mode.empty() || f_mode == "tag") {
            outputAudioTags(cgi, f);
        } else if (f_mode == "picture") {
            outputPicture(f);
        }

        ret = 0;
    } catch (std::bad_alloc &ex) {
        fprintf(stderr, "Error: allocation failed : %s\n", ex.what());
    } catch (std::invalid_argument &e) {
        std::stringstream ss;
        ss << "Exception: " << e.what();
        print_400_header(ss.str().c_str());
    }

    return ret;
}
