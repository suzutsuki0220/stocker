#include <cstdio>
#include <cstring>
#include <sstream>
#include <stdexcept>
#include <sys/stat.h>    // to get filesize
//#include <inttypes.h>  // For int64_t print

#include "htmlutil.h"
#include "cgi_util.h"
#include "UrlPath.h"
#include "Config.h"

#ifndef CONFDIR
#define CONFDIR "/var/www/stocker/conf"
#endif

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

static void print_video_tag(AVStream *vst, const int stream_no)
{
  printf("<video>\n");
  printf("  <no>%d</no>\n", stream_no);
  printf("  <bitrate>%ld</bitrate>\n", vst->codec->bit_rate);
  //printf("  <codec_name>%s</codec_name>\n", vst->codec->codec_name); // ffmpeg-1.0
  printf("  <codec>%s</codec>\n", avcodec_get_name(vst->codec->codec_id));
  printf("  <fps>%f</fps>\n", (double)vst->r_frame_rate.num / (double)vst->r_frame_rate.den);
  printf("  <fps_average>%f</fps_average>\n", (double)vst->avg_frame_rate.num / (double)vst->avg_frame_rate.den);

  printf("  <width>%d</width>\n", vst->codec->width);
  printf("  <height>%d</height>\n", vst->codec->height);

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

  printf("  <disp_width>%d</disp_width>\n", disp_width);
  printf("  <disp_height>%d</disp_height>\n", disp_height);
  printf("  <disp_aspect>%d:%d</disp_aspect>\n", aspect_x, aspect_y);
  printf("  <sar>%d:%d</sar>\n", vst->codec->sample_aspect_ratio.num, vst->codec->sample_aspect_ratio.den);
  printf("</video>\n");
}

static void print_audio_tag(AVStream *ast, const int stream_no)
{
  printf("<audio>\n");
  printf("  <no>%d</no>\n", stream_no);
  printf("  <sample_rate>%d</sample_rate>\n", ast->codec->sample_rate);
  printf("  <channel>%d</channel>\n", ast->codec->channels);
  printf("  <bitrate>%ld</bitrate>\n", ast->codec->bit_rate);
  const char *s = av_get_sample_fmt_name(ast->codec->sample_fmt);
  if (s) printf("  <sample_fmt>%s</sample_fmt>\n", s);
  else   printf("  <sample_fmt>Unknown</sample_fmt>\n");
//    printf("  <codec_name>%s</codec_name>\n", ast->codec->codec->long_name);
  printf("  <codec>%s</codec>\n", avcodec_get_name(ast->codec->codec_id));
  printf("</audio>\n");
}

const size_t get_filesize(const char *filename)
{
  struct stat status;
  size_t size = -1;
  if (stat(filename, &status) == 0) {
    size = status.st_size;
  }
  return size;
}

int main (int argc, char **argv)
{
    int ret = -1;
    cgi_util *cgi = NULL;
    UrlPath  *urlpath = NULL;
    FileUtil *fileutil = NULL;
    std::string filepath;
    std::stringstream ss;

    AVFormatContext *fmt_ctx = NULL;
    AVDictionaryEntry *tag = NULL;

    try {
        char linebuf[256];

        cgi = new cgi_util();
        if (cgi->parse_param() != 0) {
            print_400_header(cgi->get_err_message().c_str());
            return -1;
        }

        urlpath = new UrlPath(CONFDIR);

        std::string f_dir  = cgi->get_value("dir");
        std::string f_file = cgi->get_value("file");

        f_dir = cgi->decodeFormURL(f_dir);

        if (urlpath->getDecodedPath(filepath, f_dir, f_file) != 0) {
            print_400_header("failed to determine filepath");
            return -1;
        }

      ss << "<?xml version=\"1.0\" encoding=\"UTF-8\"?>" << std::endl;
      ss << "<movie_info>" << std::endl;

        fileutil = new FileUtil();
        std::string basename;
        fileutil->getBasename(basename, filepath);
        ss << "<filename>" << basename << "</filename>" << std::endl;
        snprintf(linebuf, sizeof(linebuf), "<filesize>%zd</filesize>", fileutil->getFilesize(filepath));
        ss << linebuf << std::endl;
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

    printf("%s", ss.str().c_str());
    avformat_find_stream_info(fmt_ctx, NULL);

    //printf("Streams: %d\n", fmt_ctx->nb_streams);

    printf("<format>%s</format>\n", fmt_ctx->iformat->long_name);
    if (fmt_ctx->duration != AV_NOPTS_VALUE) {
      int hours, mins, secs, us;
      int64_t duration = fmt_ctx->duration + 5000;
      secs = duration / AV_TIME_BASE;
      us = duration % AV_TIME_BASE;
      mins = secs / 60;
      secs %= 60;
      hours = mins / 60;
      mins %= 60;
      printf("<duration>%02d:%02d:%02d.%02d</duration>\n",
                  hours, mins, secs, (100*us)/AV_TIME_BASE);
//      printf("Duration: %" PRId64 " (%02d:%02d:%02d.%02d)\n",
//                  fmt_ctx->duration, hours, mins, secs, (100*us)/AV_TIME_BASE);
    }

    for(int i=0; i<fmt_ctx->nb_streams; i++) {
        AVStream *s = fmt_ctx->streams[i];
        if( s->codec->codec_type == AVMEDIA_TYPE_VIDEO) {
            print_video_tag(s, i);
        } else if( s->codec->codec_type == AVMEDIA_TYPE_AUDIO) {
            print_audio_tag(s, i);
        }
    }

    printf("<media_tags>\n");
    while ((tag = av_dict_get(fmt_ctx->metadata, "", tag, AV_DICT_IGNORE_SUFFIX)))
        printf("  <%s>%s</%s>\n", tag->key, tag->value, tag->key);
    printf("</media_tags>\n");

    printf("</movie_info>\n");
    avformat_close_input(&fmt_ctx);
    ret = 0;

END:
    return ret;
}

