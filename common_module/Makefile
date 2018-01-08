debug=1

TARGET_SHARE=libstockercommon.so
TARGET_STATIC=libstockercommon.a
INC=$(wildcard Inc/*.h Inc/*.hpp)
SRC=$(wildcard Src/*.cpp)
OBJECTS=$(subst .cpp,.o,$(SRC))
CC=gcc
CPP=g++

ifeq ($(debug), 1)
	CFLAGS=-g
else
	CFLAGS=-O2 -DNDEBUG
endif
CFLAGS+=-I./Inc -fPIC -Wall
CPPFLAGS=$(CFLAGS)

DESTDIR   = /var/www
CGI_DIR   = $(DESTDIR)/cgi-bin/stocker
BASE_DIR  = $(DESTDIR)/stocker
BIN_DIR   = $(BASE_DIR)/bin
CONF_DIR  = $(BASE_DIR)/conf

.phony: all clean install

all: $(TARGET_SHARE) $(TARGET_STATIC)

%.o: %.cpp $(INC)
	$(CPP) $(CPPFLAGS) -o $@ -c $<

clean:
	$(RM) $(TARGET_STATIC) $(TARGET_SHARE) $(OBJECTS) *~ Inc/*~ Src/*~

$(TARGET_SHARE): $(OBJECTS)
	$(CPP) $(CPPFLAGS) -shared $^ -o $@

$(TARGET_STATIC): $(OBJECTS)
	ar rv $@ $^
