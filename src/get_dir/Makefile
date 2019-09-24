debug=1

TARGET=get_dir
SRC=$(wildcard *.cpp)
OBJECTS=$(subst .cpp,.o,$(SRC))
CC=gcc
CPP=g++

include ../directory_defs.mk

DEST_DIR = ../../dist/cgi-bin

ifeq ($(debug), 1)
	CFLAGS=-g -Wall
else
	CFLAGS=-O2 -Wall -DNDEBUG
endif
CFLAGS+= -I$(COMMON_MODULE_DIR)/Inc
CPPFLAGS=$(CFLAGS)

.phony: all clean install

all: $(LIBSTOCKER_COMMON) $(addprefix $(DEST_DIR)/,$(TARGET))

$(DEST_DIR)/$(TARGET): $(OBJECTS) $(LIBSTOCKER_COMMON)
	$(CPP) $(CPPFLAGS) -o $@ $^

$(LIBSTOCKER_COMMON):
	make -C $(COMMON_MODULE_DIR)

%.o: %.cpp $(INC)
	$(CPP) $(CPPFLAGS) -o $@ -c $<

clean:
	$(RM) $(DEST_DIR)/$(TARGET) $(OBJECTS) *~
	make -C $(COMMON_MODULE_DIR) clean

install:
	mkdir -p $(CGI_DIR)
	cp -r $(DEST_DIR)/$(TARGET) $(CGI_DIR)
