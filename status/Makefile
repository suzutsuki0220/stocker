debug=1

FS_STATUS=fs_status
MEM_STATUS=mem_status

TARGET=$(FS_STATUS) $(MEM_STATUS)
SRC=$(FS_STATUS).cpp  $(MEM_STATUS).cpp
OBJS=$(SRC:.cpp=.o)
LIBFLAG=-L./
CC=g++

COMMON_MODULE=../common_module/libstockercommon.a

ifeq ($(debug), 1)
	CFLAGS=-g -Wall
else
	CFLAGS=-O2 -Wall
endif
CFLAGS+= -I../common_module/Inc
CPPFLAGS=$(CFLAGS)

include ../directory_defs.mk

.PHONY: all clean install

all: $(TARGET) $(COMMON_MODULE)

%.o: %.cpp %.h
	$(CC) $(CPPFLAGS) -o $@ -c $<

$(FS_STATUS): $(FS_STATUS).o $(COMMON_MODULE)
	$(CC) $(CPPFLAGS) -o $@ $^ $(LIBFLAG)

$(MEM_STATUS): $(MEM_STATUS).o $(COMMON_MODULE)
	$(CC) $(CPPFLAGS) -o $@ $^ $(LIBFLAG)

$(COMMON_MODULE):
	make -C ../common_module

clean:
	rm -f $(TARGET) $(OBJS) *~
	make -C ../common_module clean

install:
	mkdir -p $(CGI_DIR)
	cp $(TARGET) $(CGI_DIR)
