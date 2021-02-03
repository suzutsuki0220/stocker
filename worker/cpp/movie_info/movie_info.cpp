#include <cstdio>
#include <cstring>
#include <sstream>
#include <stdexcept>
//#include <inttypes.h>  // For int64_t print

#include "htmlutil.h"
#include "cgi_util.h"
#include "UrlPath.h"
#include "Config.h"

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

  if (a == 0 || b == 0) {
    return 0;
  }
  while (a != b) {
    if (a > b) {
      r = a - b;
      a = b;
      b = r;
    } else {
      r = b - a;
      b = r;
    }
    if (a <= 0 || b <= 0) {
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
  ss << "<video>" << std::endl;
  ss << "  <no>" << stream_no << "</no>" << std::endl;
  ss << "  <bitrate>" << vst->codec->bit_rate << "</bitrate>" << std::endl;
  //ss << "  <codec_name>" << vst->codec->codec_name << " </codec_name> << std::endl; // ffmpeg-1.0
  ss << "  <codec>" << avcodec_get_name(vst->codec->codec_id) << "</codec>" << std::endl;
  ss << "  <fps>" << (double)vst->r_frame_rate.num / (double)vst->r_frame_rate.den << "</fps>" << std::endl;
  ss << "  <fps_average>" << (double)vst->avg_frame_rate.num / (double)vst->avg_frame_rate.den << "</fps_average>" << std::endl;
  ss << "  <width>" << vst->codec->width << "</width>" << std::endl;
  ss << "  <height>" << vst->codec->height << "</height>" << std::endl;

  int disp_width  = vst->codec->width;
  int disp_height = vst->codec->height;
  if (vst->codec->sample_aspect_ratio.num > 0 && vst->codec->sample_aspect_ratio.den > 0) {
    float ratio = (float)vst->codec->sample_aspect_ratio.num / (float)vst->codec->sample_aspect_ratio.den;
    disp_width = (int)((float)vst->codec->width * ratio + 0.5);
  }

  int aspect_x = 1; int aspect_y = 1;
  int aspect_ratio = get_ratio(disp_width, disp_height);
  if (aspect_ratio != 0) {
    aspect_x = disp_width / aspect_ratio;
    aspect_y = disp_height / aspect_ratio;
  }

  ss << "  <disp_width>" << disp_width << "</disp_width>" << std::endl;
  ss << "  <disp_height>" << disp_height << "</disp_height>" << std::endl;
  ss << "  <disp_aspect>" << aspect_x << ":" << aspect_y << "</disp_aspect>" << std::endl;
  ss << "  <sar>" << vst->codec->sample_aspect_ratio.num << ":" << vst->codec->sample_aspect_ratio.den << "</sar>" << std::endl;
  ss << "</video>" << std::endl;

}

static void print_audio_tag(std::stringstream &ss, AVStream *ast, const int stream_no)
{
  ss << "<audio>" << std::endl;
  ss << "  <no>" << stream_no << "</no>" << std::endl;
  ss << "  <sample_rate>" << ast->codec->sample_rate << "</sample_rate>" << std::endl;
  ss << "  <channel>" << ast->codec->channels << "</channel>" << std::endl;
  ss << "  <bitrate>" << ast->codec->bit_rate << "</bitrate>" << std::endl;

  const char *s = av_get_sample_fmt_name(ast->codec->sample_fmt);
  ss << "  <sample_fmt>" <<  (s ? s : "Unknown") << "</sample_fmt>" << std::endl;
//    ss << "  <codec_name>%s</codec_name>\n", ast->codec->codec->long_name); << std::endl;
  ss << "  <codec>" << avcodec_get_name(ast->codec->codec_id) << "</codec>" << std::endl;
  ss << "</audio>" << std::endl;

}

int main (int argc, char **argv)
{
    int ret = -1;
    cgi_util *cgi = NULL;
    FileUtil *fileutil = NULL;
    std::string filepath;
    std::stringstream ss;

    AVFormatContext *fmt_ctx = NULL;
    AVDictionaryEntry *tag = NULL;

    ss << "<?xml version=\"1.0\" encoding=\"UTF-8\"?>" << std::endl;
    ss << "<movie_info>" << std::endl;

    try {
        cgi = new cgi_util();
        if (cgi->parse_param() != 0) {
            print_400_header(cgi->get_err_message().c_str());
            return -1;
        }

        UrlPath  *urlpath = new UrlPath();

        std::string f_dir  = cgi->get_value("dir");
        std::string f_file = cgi->get_value("file");

        f_dir = cgi->decodeFormURL(f_dir);

        if (urlpath->getDecodedPath(filepath, f_dir, f_file) != 0) {
            std::stringstream ss;
            ss << "failed to determine filepath - " << urlpath->getErrorMessage();
            print_400_header(ss.str().c_str());
            return -1;
        }

        fileutil = new FileUtil();
        std::string basename;
        fileutil->getBasename(basename, filepath);
        ss << "<filename>" << basename << "</filename>" << std::endl;
        ss << "<filesize>" << fileutil->getFilesize(filepath) << "</filesize>" << std::endl;
    } catch (std::bad_alloc ex) {
        fprintf(stderr, "Error: allocation failed : %s\n", ex.what());
        goto END;
    } catch (std::invalid_argument e) {
        std::stringstream ss;
        ss << "Exception: " << e.what();
        print_400_header(ss.str().c_str());
        goto END;
    }

    av_register_all();
    if ((ret = avformat_open_input(&fmt_ctx, filepath.c_str(), NULL, NULL))) {
        print_400_header("failed to open mediafile");
        goto END;
    }

    avformat_find_stream_info(fmt_ctx, NULL);

    //printf("Streams: %d\n", fmt_ctx->nb_streams);

    ss << "<format>" << fmt_ctx->iformat->long_name << "</format>" << std::endl;
    if (fmt_ctx->duration != AV_NOPTS_VALUE) {
      char line_buf[256];
      int hours, mins, secs, us;
      int64_t duration = fmt_ctx->duration + 5000;
      secs = duration / AV_TIME_BASE;
      us = duration % AV_TIME_BASE;
      mins = secs / 60;
      secs %= 60;
      hours = mins / 60;
      mins %= 60;
      snprintf(line_buf, sizeof(line_buf), "<duration>%02d:%02d:%02d.%02d</duration>",
                  hours, mins, secs, (100*us)/AV_TIME_BASE);
//      ss << "Duration: %" PRId64 " (%02d:%02d:%02d.%02d)\n",
//                  fmt_ctx->duration, hours, mins, secs, (100*us)/AV_TIME_BASE);
      ss << line_buf << std::endl;
    }

    for(int i=0; i<fmt_ctx->nb_streams; i++) {
        AVStream *s = fmt_ctx->streams[i];
        if( s->codec->codec_type == AVMEDIA_TYPE_VIDEO) {
            print_video_tag(ss, s, i);
        } else if( s->codec->codec_type == AVMEDIA_TYPE_AUDIO) {
            print_audio_tag(ss, s, i);
        }
    }

    ss << "<media_tags>" << std::endl;
    while ((tag = av_dict_get(fmt_ctx->metadata, "", tag, AV_DICT_IGNORE_SUFFIX)))
        ss << "  <" << tag->key << ">" << tag->value << "</" << tag->key << ">" << std::endl;
    ss << "</media_tags>" << std::endl;

    ss << "</movie_info>" << std::endl;
    avformat_close_input(&fmt_ctx);

    print_200_header("application/xml", ss.str().length(), false);
    fwrite(ss.str().c_str(), ss.str().length(), sizeof(char), stdout);
    ret = 0;

END:
    return ret;
}

