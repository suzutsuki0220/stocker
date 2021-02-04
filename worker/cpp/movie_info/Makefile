# use pkg-config for getting CFLAGS and LDLIBS
FFMPEG_LIBS=    libavdevice                        \
                libavformat                        \
                libavfilter                        \
                libavcodec                         \
                libswresample                      \
                libswscale                         \
                libavutil                          \

include ../directory_defs.mk

CFLAGS+=-I../include

CFLAGS += -Wall -O2 -g -fPIC
CFLAGS := $(shell pkg-config --cflags $(FFMPEG_LIBS)) $(CFLAGS)
LDLIBS := $(shell pkg-config --libs $(FFMPEG_LIBS)) $(LDLIBS)
CPPFLAGS=$(CFLAGS)

CPP=g++

TARGET = movie_info.a
SRC=$(wildcard *.cpp)
OBJS=$(subst .cpp,.o,$(SRC))

# the following examples make explicit use of the math library
decoding_encoding: LDLIBS += -lm
muxing:            LDLIBS += -lm

.phony: all clean

all: $(TARGET)

%.o: %.cpp
	$(CPP) $(CPPFLAGS) -o $@ -c $< $(LDLIBS)

$(TARGET): $(OBJS)
	ar rv $@ $^

clean:
	$(RM) $(OBJS) $(TARGET)
