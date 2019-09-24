debug=1

FS_STATUS=fs_status
MEM_STATUS=mem_status

TARGET=$(FS_STATUS) $(MEM_STATUS)
SRC=$(FS_STATUS).cpp  $(MEM_STATUS).cpp
OBJS=$(SRC:.cpp=.o)
LIBFLAG=-L./
CC=g++

include ../directory_defs.mk

DEST_DIR = ../../dist/cgi-bin

ifeq ($(debug), 1)
	CFLAGS=-g -Wall
else
	CFLAGS=-O2 -Wall
endif
CFLAGS+= -I$(COMMON_MODULE_DIR)/Inc
CPPFLAGS=$(CFLAGS)

.PHONY: all clean install

all: $(LIBSTOCKER_COMMON) $(addprefix $(DEST_DIR)/,$(TARGET))

%.o: %.cpp %.h
	$(CC) $(CPPFLAGS) -o $@ -c $<

$(DEST_DIR)/$(FS_STATUS): $(FS_STATUS).o $(LIBSTOCKER_COMMON)
	$(CC) $(CPPFLAGS) -o $@ $^ $(LIBFLAG)

$(DEST_DIR)/$(MEM_STATUS): $(MEM_STATUS).o $(LIBSTOCKER_COMMON)
	$(CC) $(CPPFLAGS) -o $@ $^ $(LIBFLAG)

$(LIBSTOCKER_COMMON):
	make -C $(COMMON_MODULE_DIR)

clean:
	rm -f $(addprefix $(DEST_DIR)/,$(TARGET)) $(OBJS) *~
	make -C $(COMMON_MODULE_DIR) clean

install:
	mkdir -p $(CGI_DIR)
	cp $(addprefix $(DEST_DIR)/,$(TARGET)) $(CGI_DIR)
