# use pkg-config for getting CFLAGS and LDLIBS
FFMPEG_LIBS=    libavdevice                        \
                libavformat                        \
                libavfilter                        \
                libavcodec                         \
                libswresample                      \
                libswscale                         \
                libavutil                          \

CFLAGS += -Wall -O2 -g
CFLAGS := $(shell pkg-config --cflags $(FFMPEG_LIBS)) $(CFLAGS)
LDLIBS := $(shell pkg-config --libs $(FFMPEG_LIBS)) $(LDLIBS)

DESTDIR   = /var/www
BASE_DIR  = $(DESTDIR)/stocker
BIN_DIR   = $(BASE_DIR)/bin

TARGET = movie_info

OBJS=$(addsuffix .o,$(TARGET))

# the following examples make explicit use of the math library
decoding_encoding: LDLIBS += -lm
muxing:            LDLIBS += -lm

.phony: all clean install

all: $(OBJS) $(TARGET)

clean:
	$(RM) $(TARGET) $(OBJS)

install: $(TARGET)
	mkdir -p $(BIN_DIR)
	cp $(TARGET) $(BIN_DIR)
