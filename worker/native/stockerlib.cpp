#include "stockerlib.h"
#include "UrlPath.h"

using namespace Napi;

FunctionReference StockerLib::constructor;

StockerLib::StockerLib(const CallbackInfo &info) : ObjectWrap<StockerLib>(info)
{
    Napi::Env env = info.Env();
    HandleScope scope(env);

    urlPath = new UrlPath();
}

Napi::Value
StockerLib::encodeUrlPath(const CallbackInfo &info)
{
    Napi::Env env = info.Env();
    std::string encoded_path;

    // expect parameters are 'root' and 'path'
    if (!info[0].IsString() || !info[1].IsString())
    {
        TypeError::New(env, "parameter type is not string").ThrowAsJavaScriptException();
        return env.Null();
    }

    std::string root = info[0].ToString().Utf8Value();
    std::string path = info[1].ToString().Utf8Value();

    if (urlPath->getEncodedPath(encoded_path, root, path) != 0)
    {
        Error::New(env, urlPath->getErrorMessage()).ThrowAsJavaScriptException();
        return env.Null();
    }

    return String::New(env, encoded_path.c_str());
}

Napi::Value
StockerLib::decodeUrlPath(const CallbackInfo &info)
{
    Napi::Env env = info.Env();
    std::string p_path;

    // expect parameters are 'root' and 'encoded_path'
    if (!info[0].IsString() || !info[1].IsString())
    {
        TypeError::New(env, "parameter type is not string").ThrowAsJavaScriptException();
        return env.Null();
    }

    std::string root = info[0].ToString().Utf8Value();
    std::string path = info[1].ToString().Utf8Value();

    if (urlPath->getDecodedPath(p_path, root, path) != 0)
    {
        Error::New(env, urlPath->getErrorMessage()).ThrowAsJavaScriptException();
        return env.Null();
    }

    return String::New(env, p_path.c_str());
}

Object
StockerLib::Init(Napi::Env env, Object exports)
{
    HandleScope scope(env);

    Function func = DefineClass(env, "StockerLib", {InstanceMethod("encodeUrlPath", &StockerLib::encodeUrlPath), InstanceMethod("decodeUrlPath", &StockerLib::decodeUrlPath)});

    constructor = Napi::Persistent(func);
    constructor.SuppressDestruct();

    exports.Set("StockerLib", func);

    return exports;
}

Object InitAll(Napi::Env env, Object exports)
{
    return StockerLib::Init(env, exports);
}

NODE_API_MODULE(stockerlib, InitAll)
