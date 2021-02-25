#pragma once

#include <string>
#include "path.h"
#include "response_buffer.h"

int media_tag(Path_t &decodedPath, std::string &result);
int cover_art(Path_t &decodedPath, response_buffer_t &result);
