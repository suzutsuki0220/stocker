debug=1

TARGET=get_file
OBJECTS=Range.o
CC=gcc
CPP=g++

include ../directory_defs.mk

ifeq ($(debug), 1)
	CFLAGS=-g -Wall
else
	CFLAGS=-O2 -Wall -DNDEBUG
endif
CFLAGS+= -I$(COMMON_MODULE_DIR)/Inc

CPPFLAGS=$(CFLAGS)

.phony: all clean install

all: $(OBJECTS) $(LIBSTOCKER_COMMON)

$(LIBSTOCKER_COMMON):
	make -C $(COMMON_MODULE_DIR)

%.o: %.cpp %.h
	$(CPP) $(CPPFLAGS) -o $@ -c $<

clean:
	$(RM) $(TARGET) $(OBJECTS) $(TARGET).o *~
	make -C $(COMMON_MODULE_DIR) clean

install:
	mkdir -p $(CGI_DIR)
	$(CPP) $(CPPFLAGS) -DCONFDIR=\"$(CONF_DIR)\" -o $(CGI_DIR)/$(TARGET) $(OBJECTS) $(TARGET).cpp $(LIBSTOCKER_COMMON)

