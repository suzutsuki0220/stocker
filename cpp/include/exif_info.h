#pragma once

#include <string>
#include "path.h"
#include "response_buffer.h"

void get_exif(Path_t &decodedPath, std::string &result);
void get_exif_thumbnail(Path_t &decodedPath, response_buffer_t &result);
