#pragma once

#include <stdint.h>

typedef struct response_buffer {
    char mime_type[32];
    uint32_t size;
    char *byte;
} response_buffer_t;