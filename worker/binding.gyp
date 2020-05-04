{
  "targets": [
    {
      "target_name": "addon",
      "sources": [ "native/addon.cpp" ],
      "defines" : [ "NAPI_DISABLE_CPP_EXCEPTIONS" ],
      "include_dirs" : [ "<!@(node -p \"require( 'node-addon-api' ).include\")" ]
    }
  ]
}
