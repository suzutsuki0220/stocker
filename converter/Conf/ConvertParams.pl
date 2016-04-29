#
# エンコードパラメータ設定ファイル
#

# CONVERT_PARAMS  ffmpegに渡すパラメータを設定します
# 項目1: format FORMから送られてくるformatパラメータ
# 項目2: 出力ファイルの拡張子
# 項目3: 入力ファイルより前に指定するオプション
# 項目4: videoコーデック
# 項目5: audioコーデック
# 項目6: 出力ファイルの前に指定するオプション
# 項目7: ファイルフォーマット

@CONVERT_PARAMS = (
   [
       "copy",
       "",
       "",
       "",
       "",
       "",
       ""
   ],
  [
      "dvd",
      "mpeg",
      "-threads 2 -target ntsc-dvd",
      "mpeg2video",
      "ac3",
      "-strict experimental",
      "dvd"
  ],
  [
      "mpeg4",
      "mp4",
      "",
      "mpeg4",
      "libfaac",
      "-strict experimental",
      "mp4"
  ],
  [
      "H.264",
      "mp4",
      "",
      "libx264",
      #"aac",        # worst quality
      #"libfaac",    # better
      "libfdk_aac",  # best quality but less compatibility
      " -nr 600 -mbd 2 -coder 0 -bufsize 1024k -g 15 -qmin 12 -profile:a aac_he -afterburner 1",
      "mp4"
  ],
  [
      "wmv",
      "wmv",
      "",
      "wmv2",
      "wmav2",
      "",
      "asf"
  ],
  [
      "asf",
      "asf",
      "",
      "wmv1",
      "wmav1",
      "",
      "asf"
  ],
  [
      "webm",
      "webm",
      "",
      "vp8",
      "libvorbis",
      "-strict experimental",
      "webm"
  ],
  [
      "ogv",
      "ogv",
      "",
      "libtheora",
      "libvorbis",
      "-strict experimental",
      "ogg"
  ],
  [
      "flac",
      "flac",
      "",
      "",
      "flac",
      "",
      "flac"
  ],
  [
      "wav",
      "wav",
      "",
      "",
      "pcm_s16le",
      "",
      "wav"
  ],
  [
      "mp3",
      "mp3",
      "",
      "",
      "libmp3lame",
      "",
      "mp3"
  ],
  [
      "aac",
      "aac",
      "",
      "",
      "libfdk_aac",
      "-profile:a aac_he -afterburner 1 -strict experimental",
      "mp4"
  ],
);

1;
__END__
