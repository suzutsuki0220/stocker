{
  "targets": [
    {
      "target_name": "stockerlib",
      "cflags!": [ "-fno-exceptions" ],
      "cflags_cc!": [ "-fno-exceptions" ],
      "sources": [ "native/stockerlib.cpp" ],
      "defines" : [ "NAPI_DISABLE_CPP_EXCEPTIONS" ],
      'libraries': [ "../../src/common/libstockercommon.a" ],
      "include_dirs" : [
        "<!@(node -p \"require('node-addon-api').include\")",
        "../src/common/Inc"
      ]
    }
  ]
}
