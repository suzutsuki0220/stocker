debug=1

TARGET=get_dir
INC=$(wildcard Inc/*.h Inc/*.hpp)
SRC=$(wildcard Src/*.cpp)
OBJECTS=$(subst .cpp,.o,$(SRC))
CC=gcc
CPP=g++

COMMON_MODULE_DIR=../common
LIBSTOCKER_COMMON=$(COMMON_MODULE_DIR)/libstockercommon.a

ifeq ($(debug), 1)
	CFLAGS=-g -Wall
else
	CFLAGS=-O2 -Wall -DNDEBUG
endif
CFLAGS+= -I$(COMMON_MODULE_DIR)/Inc
CPPFLAGS=$(CFLAGS)

include ../directory_defs.mk

.phony: all clean install

all: $(OBJECTS) $(LIBSTOCKER_COMMON)

$(LIBSTOCKER_COMMON):
	make -C $(COMMON_MODULE_DIR)

%.o: %.cpp $(INC)
	$(CPP) $(CPPFLAGS) -o $@ -c $<

clean:
	$(RM) $(TARGET) $(OBJECTS) *~
	make -C $(COMMON_MODULE_DIR) clean

install:
	mkdir -p $(CGI_DIR)
	$(CPP) $(CPPFLAGS) -DCONFDIR=\"$(CONF_DIR)\" -o $(CGI_DIR)/$(TARGET) $(OBJECTS) $(TARGET).cpp $(LIBSTOCKER_COMMON)

