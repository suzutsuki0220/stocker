{
  "targets": [
    {
      "target_name": "stockerlib",
      "cflags!": [ "-fno-exceptions" ],
      "cflags_cc!": [ "-fno-exceptions" ],
      "sources": [
        "./native/stockerlib.cpp"
      ],
      "defines" : [ "NAPI_DISABLE_CPP_EXCEPTIONS" ],
      "libraries": [
        "../cpp/common/libstockercommon.a"
      ],
      "include_dirs" : [
        "<!@(node -p \"require('node-addon-api').include\")",
        "./cpp/common/Inc"
      ]
    }, {
      "target_name": "medialib",
      "cflags!": [ "-fno-exceptions" ],
      "cflags_cc!": [ "-fno-exceptions" ],
      "ldflags": [
        "-lexif",
        "-ltag",
        "-lavdevice", "-lavformat", "-lavfilter", "-lavcodec", "-lswresample", "-lswscale", "-lavutil"
      ],
      "sources": [
         "./native/medialib.cpp"
      ],
      "defines" : [ "NAPI_DISABLE_CPP_EXCEPTIONS" ],
      "libraries": [
        "../cpp/common/libstockercommon.a",
        "../cpp/exif_info/exif_info.a",
        "../cpp/movie_info/movie_info.a"
      ],
      "include_dirs" : [
        "<!@(node -p \"require('node-addon-api').include\")",
        "./cpp/common/Inc",
        "./cpp/include"
      ]
    }
  ]
}
