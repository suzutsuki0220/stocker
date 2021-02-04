# use pkg-config for getting CFLAGS and LDLIBS
EXIF_LIBS=libexif
TARGET=exif_info.a
CPP=g++

CFLAGS += -Wall -O2 -g -fPIC
CFLAGS := $(shell pkg-config --cflags $(EXIF_LIBS)) $(CFLAGS)
LDLIBS := $(shell pkg-config --libs $(EXIF_LIBS)) $(LDLIBS)

include ../directory_defs.mk

CFLAGS+=-I../include
CPPFLAGS=$(CFLAGS)

SRC=$(wildcard *.cpp)
OBJS=$(subst .cpp,.o,$(SRC))

.phony: all clean

all: $(TARGET)

.cpp.o:
	$(CPP) $(CPPFLAGS) -o $@ -c $< $(LDLIBS)

$(TARGET): $(OBJS)
	ar rv $@ $^

clean:
	$(RM) $(TARGET) $(OBJS)
