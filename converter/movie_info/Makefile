# use pkg-config for getting CFLAGS and LDLIBS
FFMPEG_LIBS=    libavdevice                        \
                libavformat                        \
                libavfilter                        \
                libavcodec                         \
                libswresample                      \
                libswscale                         \
                libavutil                          \

COMMON_MODULE_DIR=../../common_module
LIBSTOCKER_COMMON=$(COMMON_MODULE_DIR)/libstockercommon.a
CFLAGS+=-I$(COMMON_MODULE_DIR)/Inc

CFLAGS += -Wall -O2 -g
CFLAGS := $(shell pkg-config --cflags $(FFMPEG_LIBS)) $(CFLAGS)
LDLIBS := $(shell pkg-config --libs $(FFMPEG_LIBS)) $(LDLIBS)
CPPFLAGS=$(CFLAGS)

include ../../directory_defs.mk

TARGET = movie_info
CPP=g++

OBJS=$(addsuffix .o,$(TARGET))

# the following examples make explicit use of the math library
decoding_encoding: LDLIBS += -lm
muxing:            LDLIBS += -lm

.phony: all clean install

all: $(OBJS) $(COMMON_MODULE)

$(COMMON_MODULE):
	make -C $(COMMON_MODULE_DIR)

clean:
	$(RM) $(TARGET) $(OBJS)

install:
	mkdir -p $(BIN_DIR)
	$(CPP) $(CPPFLAGS) -DCONFDIR=\"$(CONF_DIR)\" -o $(CGI_DIR)/$(TARGET) $(TARGET).cpp $(LIBSTOCKER_COMMON) $(LDLIBS)
