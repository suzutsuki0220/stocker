# use pkg-config for getting CFLAGS and LDLIBS
FFMPEG_LIBS=    libavdevice                        \
                libavformat                        \
                libavfilter                        \
                libavcodec                         \
                libswresample                      \
                libswscale                         \
                libavutil                          \

include ../directory_defs.mk

DEST_DIR = ../../dist/cgi-bin

CFLAGS+=-I$(COMMON_MODULE_DIR)/Inc

CFLAGS += -Wall -O2 -g
CFLAGS := $(shell pkg-config --cflags $(FFMPEG_LIBS)) $(CFLAGS)
LDLIBS := $(shell pkg-config --libs $(FFMPEG_LIBS)) $(LDLIBS)
CPPFLAGS=$(CFLAGS)

CPP=g++

TARGET = movie_info
SRC=$(wildcard *.cpp)
OBJS=$(subst .cpp,.o,$(SRC))

# the following examples make explicit use of the math library
decoding_encoding: LDLIBS += -lm
muxing:            LDLIBS += -lm

.phony: all clean install

all: $(LIBSTOCKER_COMMON) $(addprefix $(DEST_DIR)/,$(TARGET))

$(DEST_DIR)/$(TARGET): $(OBJS) $(LIBSTOCKER_COMMON)
	$(CPP) $(CPPFLAGS) -o $@ $^ $(LDLIBS)

$(LIBSTOCKER_COMMON):
	make -C $(COMMON_MODULE_DIR)

clean:
	$(RM) $(DEST_DIR)/$(TARGET) $(OBJS)

install:
	mkdir -p $(CGI_DIR)
	cp -r $(DEST_DIR)/$(TARGET) $(CGI_DIR)
