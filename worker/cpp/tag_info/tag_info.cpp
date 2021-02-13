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
#include <cstring>
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

#include "tag_info.h"
#include "noimage.h"

using namespace std;

#define MYBUFSZ 1024
void
conv(string &str)
{
    iconv_t ic;
    char    str_out[MYBUFSZ+1];
    char    *ptr_in  = (char*)str.c_str();
    size_t  ptr_in_size = str.size();
    char    *ptr_out = str_out;
    size_t  mybufsz = (size_t) MYBUFSZ;

    ic = iconv_open("UTF-8", "UTF-16");
    iconv(ic, &ptr_in, &ptr_in_size, &ptr_out, &mybufsz);
    iconv_close(ic);

    str = ptr_out;
}

const void
extractFileProperty(std::stringstream &ss, TagLib::File *file) {
    if (!file || file->properties().isEmpty()) {
        return;
    }

    const TagLib::PropertyMap prop = file->properties();
    if (prop.contains("DISCNUMBER")) {
        ss << "\"disc_number\": \"" << prop["DISCNUMBER"].toString() << "\", ";
    }
}

void
get_media_tag(std::string &result, TagLib::FileRef &f)
{
    if (f.isNull() || !f.tag()) {
        throw std::runtime_error("invalid file reference");
    }

    std::stringstream ss;
    TagLib::Tag *tag = f.tag();

    //string title = tag->title().toCString();
    //conv(title);

    ss << "{ ";
    extractFileProperty(ss, f.file());

    if (f.audioProperties()) {
        TagLib::AudioProperties *properties = f.audioProperties();
        int seconds = properties->length() % 60;
        int minutes = (properties->length() - seconds) / 60;

        ss << "\"bitrate\": "     << properties->bitrate()    << ", ";
        ss << "\"sample_rate\": " << properties->sampleRate() << ", ";
        ss << "\"channels\": "    << properties->channels()   << ", ";
        ss << "\"duration\": "    << properties->length()     << ", ";
        ss << "\"time\": \"" << minutes << ":" << setfill('0') << setw(2) << seconds << "\", ";
    }

    ss << "\"title\": \""   << tag->title().to8Bit(true)   << "\", ";
    ss << "\"artist\": \""  << tag->artist().to8Bit(true)  << "\", ";
    ss << "\"album\": \""   << tag->album().to8Bit(true)   << "\", ";
    ss << "\"comment\": \"" << tag->comment().to8Bit(true) << "\", ";
    ss << "\"genre\": \""   << tag->genre().to8Bit(true)   << "\", ";
    ss << "\"year\": "    << tag->year()                 << ", ";
    ss << "\"track\": "   << tag->track();
    ss << "}";

    result = ss.str();
}

void
get_cover_art(response_buffer_t &result, TagLib::FileRef &f)
{
    const char *mimetype;
    TagLib::ByteVector bytevector;

    if(f.isNull()) {
        throw std::runtime_error("invalid file reference");
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
        strcpy(result.mime_type, "image/png");
        result.size = (uint32_t)sizeof(noimage_data);
        result.byte = (char *)calloc(sizeof(noimage_data), sizeof(char));
        if (result.byte == NULL) {
            result.size = 0;
            throw std::bad_alloc();
        }
        memcpy(result.byte, noimage_data, sizeof(noimage_data));
    } else {
        strncpy(result.mime_type, mimetype, sizeof(result.mime_type) - 1);
        result.size = (uint32_t)bytevector.size();
        result.byte = (char *)calloc(bytevector.size(), sizeof(char));
        if (result.byte == NULL) {
            result.size = 0;
            throw std::bad_alloc();
        }
        memcpy(result.byte, bytevector.data(), (size_t)bytevector.size());
    }
}

int
media_tag(Path_t &decodedPath, std::string &result)
{
    int ret = -1;

    try {
        TagLib::FileRef f(decodedPath.path.c_str());
        get_media_tag(result, f);
        ret = 0;
    } catch (std::bad_alloc &ex) {
        decodedPath.error_message = ex.what();
    } catch (std::invalid_argument &e) {
        std::stringstream ss;
        ss << "Exception: " << e.what();
        decodedPath.error_message = ss.str();
    }

    return ret;
}

int
cover_art(Path_t &decodedPath, response_buffer_t &result)
{
    int ret = -1;

    try {
        TagLib::FileRef f(decodedPath.path.c_str());
        get_cover_art(result, f);
        ret = 0;
    } catch (std::bad_alloc &ex) {
        decodedPath.error_message = ex.what();
    } catch (std::invalid_argument &e) {
        std::stringstream ss;
        ss << "Exception: " << e.what();
        decodedPath.error_message = ss.str();
    }

    return ret;
}
