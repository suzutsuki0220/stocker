debug=1

FS_STATUS=fs_status
MEM_STATUS=mem_status

TARGET=$(FS_STATUS) $(MEM_STATUS)
SRC=$(FS_STATUS).cpp  $(MEM_STATUS).cpp
OBJS=$(SRC:.cpp=.o)
LIBFLAG=-L./
CC=g++

include ../directory_defs.mk

ifeq ($(debug), 1)
	CFLAGS=-g -Wall
else
	CFLAGS=-O2 -Wall
endif
CFLAGS+= -I$(COMMON_MODULE_DIR)/Inc
CPPFLAGS=$(CFLAGS)

.PHONY: all clean install

all: $(TARGET) $(LIBSTOCKER_COMMON)

%.o: %.cpp %.h
	$(CC) $(CPPFLAGS) -o $@ -c $<

$(FS_STATUS): $(FS_STATUS).o $(LIBSTOCKER_COMMON)
	$(CC) $(CPPFLAGS) -o $@ $^ $(LIBFLAG)

$(MEM_STATUS): $(MEM_STATUS).o $(LIBSTOCKER_COMMON)
	$(CC) $(CPPFLAGS) -o $@ $^ $(LIBFLAG)

$(LIBSTOCKER_COMMON):
	make -C $(COMMON_MODULE_DIR)

clean:
	rm -f $(TARGET) $(OBJS) *~
	make -C $(COMMON_MODULE_DIR) clean

install:
	mkdir -p $(CGI_DIR)
	cp $(TARGET) $(CGI_DIR)
