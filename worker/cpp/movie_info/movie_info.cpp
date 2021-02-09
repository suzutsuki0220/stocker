#include <cstdio>
#include <cstring>
#include <sstream>
#include <stdexcept>
//#include <inttypes.h>  // For int64_t print

#include "movie_info.h"

#if __cplusplus
extern "C" {
#endif

// FFMpeg API
#include <libavformat/avformat.h>
#include <libavutil/rational.h>
#include <libavutil/dict.h>
#include <libavutil/common.h>

#ifdef __cplusplus
}
#endif

int get_ratio(int a, int b)
{
    int r = 0;

    if (a == 0 || b == 0)
    {
        return 0;
    }
    while (a != b)
    {
        if (a > b)
        {
            r = a - b;
            a = b;
            b = r;
        }
        else
        {
            r = b - a;
            b = r;
        }
        if (a <= 0 || b <= 0)
        {
            return 0;
        }
    }
    return a;
}

const char *avcodec_get_name(enum AVCodecID id)
{
    const AVCodecDescriptor *cd;
    AVCodec *codec;

    if (id == AV_CODEC_ID_NONE)
        return "none";
    cd = avcodec_descriptor_get(id);
    if (cd)
        //return cd->name;
        return cd->long_name;
    codec = avcodec_find_decoder(id);
    if (codec)
        //return codec->name;
        return codec->long_name;
    codec = avcodec_find_encoder(id);
    if (codec)
        //return codec->name;
        return codec->long_name;
    return "unknown_codec";
}

static void print_video_tag(std::stringstream &ss, AVStream *vst, const int stream_no)
{
    ss << "{\"type\": \"video\", " << std::endl;
    ss << "\"no\": " << stream_no << ", " << std::endl;
    ss << "\"bitrate\": " << vst->codec->bit_rate << ", " << std::endl;
    //ss << "  <codec_name>" << vst->codec->codec_name << " </codec_name> << std::endl; // ffmpeg-1.0
    ss << "\"codec\": \"" << avcodec_get_name(vst->codec->codec_id) << "\", " << std::endl;
    ss << "\"fps\": " << ((vst->r_frame_rate.num && vst->r_frame_rate.den) ? (double)vst->r_frame_rate.num / (double)vst->r_frame_rate.den : NULL) << ", " << std::endl;
    ss << "\"fps_average\": " << ((vst->avg_frame_rate.num && vst->avg_frame_rate.den) ? (double)vst->avg_frame_rate.num / (double)vst->avg_frame_rate.den : NULL) << ", " << std::endl;
    ss << "\"width\": " << vst->codec->width << ", " << std::endl;
    ss << "\"height\": " << vst->codec->height << ", " << std::endl;

    int disp_width = vst->codec->width;
    int disp_height = vst->codec->height;
    if (vst->codec->sample_aspect_ratio.num > 0 && vst->codec->sample_aspect_ratio.den > 0)
    {
        float ratio = (float)vst->codec->sample_aspect_ratio.num / (float)vst->codec->sample_aspect_ratio.den;
        disp_width = (int)((float)vst->codec->width * ratio + 0.5);
    }

    int aspect_x = 1;
    int aspect_y = 1;
    int aspect_ratio = get_ratio(disp_width, disp_height);
    if (aspect_ratio != 0)
    {
        aspect_x = disp_width / aspect_ratio;
        aspect_y = disp_height / aspect_ratio;
    }

    ss << "\"disp_width\": " << disp_width << ", " << std::endl;
    ss << "\"disp_height\": " << disp_height << ", " << std::endl;
    ss << "\"disp_aspect\": \"" << aspect_x << ":" << aspect_y << "\", " << std::endl;
    ss << "\"sar\": \"" << vst->codec->sample_aspect_ratio.num << ":" << vst->codec->sample_aspect_ratio.den << "\"}" << std::endl;
}

static void print_audio_tag(std::stringstream &ss, AVStream *ast, const int stream_no)
{
    ss << "{\"type\": \"audio\", " << std::endl;
    ss << "\"no\": " << stream_no << ", " << std::endl;
    ss << "\"sample_rate\": " << ast->codec->sample_rate << ", " << std::endl;
    ss << "\"channel\": " << ast->codec->channels << ", " << std::endl;
    ss << "\"bitrate\": " << ast->codec->bit_rate << ", " << std::endl;

    const char *s = av_get_sample_fmt_name(ast->codec->sample_fmt);
    ss << "\"sample_fmt\": \"" << (s ? s : "Unknown") << "\", " << std::endl;
    //    ss << "  <codec_name>%s</codec_name>\n", ast->codec->codec->long_name); << std::endl;
    ss << "\"codec\": \"" << avcodec_get_name(ast->codec->codec_id) << "\"}" << std::endl;
}

int movie_info(Path_t &decodedPath, std::string &result)
{
    int ret = -1;
    std::stringstream ss;
    bool first;

    AVFormatContext *fmt_ctx = NULL;
    AVDictionaryEntry *tag = NULL;

    ss << "{" << std::endl;

    av_register_all();
    if ((ret = avformat_open_input(&fmt_ctx, decodedPath.path.c_str(), NULL, NULL)))
    {
        decodedPath.error_message = "failed to open mediafile";
        goto END;
    }

    avformat_find_stream_info(fmt_ctx, NULL);

    //printf("Streams: %d\n", fmt_ctx->nb_streams);

    ss << "\"format\": \"" << fmt_ctx->iformat->long_name << "\", " << std::endl;
    if (fmt_ctx->duration != AV_NOPTS_VALUE)
    {
        char line_buf[256];
        int hours, mins, secs, us;
        int64_t duration = fmt_ctx->duration + 5000;
        secs = duration / AV_TIME_BASE;
        us = duration % AV_TIME_BASE;
        mins = secs / 60;
        secs %= 60;
        hours = mins / 60;
        mins %= 60;
        snprintf(line_buf, sizeof(line_buf), "\"duration\": \"%02d:%02d:%02d.%02d\", ",
                hours, mins, secs, (100 * us) / AV_TIME_BASE);
        //      ss << "Duration: %" PRId64 " (%02d:%02d:%02d.%02d)\n",
        //                  fmt_ctx->duration, hours, mins, secs, (100*us)/AV_TIME_BASE);
        ss << line_buf << std::endl;
    }

    ss << "\"streams\": [" << std::endl;
    first = true;
    for (int i = 0; i < fmt_ctx->nb_streams; i++)
    {
        AVStream *s = fmt_ctx->streams[i];
        if (s->codec->codec_type == AVMEDIA_TYPE_VIDEO)
        {
            if (first == true) {
                first = false;
            } else {
                ss << ", ";
            }
            print_video_tag(ss, s, i);
        }
        else if (s->codec->codec_type == AVMEDIA_TYPE_AUDIO)
        {
            if (first == true) {
                first = false;
            } else {
                ss << ", ";
            }
            print_audio_tag(ss, s, i);
        }
    }
    ss << "]," << std::endl;

    ss << "\"tags\": [";
    first = true;
    while ((tag = av_dict_get(fmt_ctx->metadata, "", tag, AV_DICT_IGNORE_SUFFIX))) {
        if (first == true) {
            first = false;
        } else {
            ss << ", ";
        }
        ss << "\"" << tag->key << "\": \"" << tag->value << "\"";
    }
    ss << "]" << std::endl;

    ss << "}" << std::endl;
    avformat_close_input(&fmt_ctx);

    result = ss.str();
    ret = 0;

END:
    return ret;
}
