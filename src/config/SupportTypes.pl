#
# 対応形式の設定
#   拡張子は英数字、アルファベットは全て小文字
#

# @support_video_types
# 動画形式と判断するファイルの拡張子を列挙してください
@support_video_types = (
  "avi",
  "flv",
  "mov",
  "mpg", "mpeg", "mpe", "m2p",
  "ts" , "mts", "m2ts",
  "mp4", "m4v", "mpg4",
  "asf", "wmv", "3gp"
);

# @support_audio_types
# 音声形式と判断するファイルの拡張子を列挙してください
@support_audio_types = (
  "flac",
  "wav", "wma",
  "aif", "aiff", "aifc",
  "ram", "ra",
  "mp3", "m4a"
);

# @support_image_types
# 画像形式と判断するファイルの拡張子を列挙してください
@support_image_types = (
  "jpg", "jpeg",
  "png",
  "gif",
  "bmp",
  "tif", "tiff"
);
