#include <cstdlib>
#include <cstring>
#include <string>
#include <node_api.h>
#include "UrlPath.h"

#include "path.h"
#include "exif_info.h"
#include "movie_info.h"
#include "tag_info.h"

static bool
getPathArgument(napi_env env, napi_callback_info info, Path_t &decodedPath)
{
    const size_t ARGUMENTS = 2;
    size_t get_size;
    char buf[1024] = {0};
    std::string root, path;

    UrlPath *urlPath = new UrlPath();
    if (urlPath == NULL) {
        return false;
    }

    size_t argc = ARGUMENTS;
    napi_value args[ARGUMENTS];
    napi_get_cb_info(env, info, &argc, args, 0, 0);

    if (argc != ARGUMENTS) {
        return false;
    }

    napi_valuetype type1, type2;
    napi_typeof(env, args[0], &type1);
    napi_typeof(env, args[1], &type2);
    if (type1 != napi_string || type2 != napi_string) {
        return false;
    }

    napi_get_value_string_utf8(env, args[0], buf, sizeof(buf) - 1, &get_size);
    root = buf;

    napi_get_value_string_utf8(env, args[1], buf, sizeof(buf) - 1, &get_size);
    path = buf;

    if (urlPath->getDecodedPath(decodedPath.path, root, path) != 0)
    {
        napi_throw_type_error(env, NULL, urlPath->getErrorMessage());
        return false;
    }

    return true;
}

static napi_value
getResponseBuffer(napi_env env, response_buffer_t &response)
{
    char *output;
    const size_t mime_size_length = sizeof(response.mime_type) + sizeof(response.size);
    const size_t buf_size = mime_size_length + response.size;
    napi_value value;
    napi_create_arraybuffer(env, buf_size, (void**)&output, &value);
    memcpy((void*)output, (void*)&response, mime_size_length);
    memcpy((void*)(output + mime_size_length), (void*)response.byte, (size_t)response.size);

    return value;
}

napi_value
getExif(napi_env env, napi_callback_info info)
{
    Path_t path;
    std::string result_json;

    if (getPathArgument(env, info, path) == false) {
        napi_throw_type_error(env, NULL, "Wrong arguments");
        return nullptr;
    }

    try {
        get_exif(path, result_json);
    } catch(std::invalid_argument &e) {
        napi_throw_type_error(env, NULL, e.what());
        return nullptr;
    }

    napi_value string;
    napi_create_string_utf8(env, result_json.c_str(), result_json.length(), &string);

    return string;
}

napi_value
getCoverArt(napi_env env, napi_callback_info info)
{
    Path_t path;
    response_buffer_t result;

    if (getPathArgument(env, info, path) == false) {
        napi_throw_type_error(env, NULL, "Wrong arguments");
        return nullptr;
    }

    if (cover_art(path, result) != 0) {
        if (result.byte != NULL) free(result.byte);
        napi_throw_type_error(env, NULL, path.error_message.c_str());
    }

    napi_value image = getResponseBuffer(env, result);
    free(result.byte);

    return image;
}


napi_value
getMediaTag(napi_env env, napi_callback_info info)
{
    Path_t path;
    std::string result_json;

    if (getPathArgument(env, info, path) == false) {
        napi_throw_type_error(env, NULL, "Wrong arguments");
        return nullptr;
    }

    if (media_tag(path, result_json) != 0) {
        napi_throw_type_error(env, NULL, path.error_message.c_str());
    }

    napi_value string;
    napi_create_string_utf8(env, result_json.c_str(), NAPI_AUTO_LENGTH, &string);

    return string;
}

napi_value
getMovieInfo(napi_env env, napi_callback_info info)
{
    Path_t path;
    std::string result_json;

    if (getPathArgument(env, info, path) == false) {
        napi_throw_type_error(env, NULL, "Wrong arguments");
        return nullptr;
    }

    if (movie_info(path, result_json) != 0) {
        napi_throw_type_error(env, NULL, path.error_message.c_str());
    }

    napi_value string;
    napi_create_string_utf8(env, result_json.c_str(), result_json.length(), &string);

    return string;
}

napi_value
Init(napi_env env, napi_value exports)
{
    napi_status status;

    napi_value fn;
    status = napi_create_function(env, NULL, NAPI_AUTO_LENGTH, getMediaTag, NULL, &fn);
    if (status != napi_ok) return NULL;
    status = napi_set_named_property(env, exports, "getMediaTag", fn);
    if (status != napi_ok) return NULL;

    status = napi_create_function(env, NULL, NAPI_AUTO_LENGTH, getCoverArt, NULL, &fn);
    status = napi_set_named_property(env, exports, "getCoverArt", fn);

    status = napi_create_function(env, NULL, NAPI_AUTO_LENGTH, getExif, NULL, &fn);
    status = napi_set_named_property(env, exports, "getExif", fn);

    status = napi_create_function(env, NULL, NAPI_AUTO_LENGTH, getMovieInfo, NULL, &fn);
    status = napi_set_named_property(env, exports, "getMovieInfo", fn);

    return exports;
}

NAPI_MODULE(NODE_GYP_MODULE_NAME, Init)
