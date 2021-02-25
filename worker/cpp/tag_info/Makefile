debug=1

TARGET=tag_info.a
INC=$(wildcard Inc/*.h Inc/*.hpp)
SRC=tag_info.cpp
OBJECTS=$(subst .cpp,.o,$(SRC))
CC=gcc
CPP=g++
LIBPARAM=-ltag

include ../directory_defs.mk

ifeq ($(debug), 1)
	CFLAGS=-g -Wall
else
	CFLAGS=-O2 -Wall -DNDEBUG
endif
CFLAGS+=-I../include -fPIC
CPPFLAGS=$(CFLAGS)

.phony: all clean

all: noimage.h $(TARGET)

$(TARGET): $(OBJECTS)
	ar rv $@ $^

%.o: %.cpp $(INC)
	$(CPP) $(CPPFLAGS) -o $@ -c $< $(LIBPARAM)

make_noimage: make_noimage.c
	$(CC) $(CFLAGS) $< -o $@

noimage.h: noimage/noimage.png make_noimage
	./make_noimage $< $@

clean:
	$(RM) $(TARGET) $(OBJECTS) noimage.h make_noimage *~
