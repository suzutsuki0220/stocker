#ifndef STOCKERLIB_H
#define STOCKERLIB_H

#include <napi.h>

#include "UrlPath.h"

using namespace Napi;

class StockerLib : public ObjectWrap<StockerLib> {
    public:
        UrlPath *urlPath;
        static Object Init(Napi::Env env, Object exports);
        StockerLib(const CallbackInfo& info);
    private:
        static FunctionReference constructor;

        Napi::Value decodeUrlPath(const CallbackInfo& info);
        Napi::Value encodeUrlPath(const CallbackInfo& info);
};

#endif  //  STOCKERLIB_H
