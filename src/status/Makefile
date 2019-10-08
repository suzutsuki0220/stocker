debug=1

FS_STATUS=fs_status
MEM_STATUS=mem_status

TARGET=$(FS_STATUS) $(MEM_STATUS)
SRC=$(FS_STATUS).cpp  $(MEM_STATUS).cpp
OBJS=$(SRC:.cpp=.o)
LIBFLAG=-L./
CC=g++

include ../directory_defs.mk

DIST_DIR = ../../dist/cgi-bin

ifeq ($(debug), 1)
	CFLAGS=-g -Wall
else
	CFLAGS=-O2 -Wall
endif
CFLAGS+= -I$(COMMON_MODULE_DIR)/Inc
CPPFLAGS=$(CFLAGS)

.PHONY: all clean install

all: $(DIST_DIR) $(LIBSTOCKER_COMMON) $(addprefix $(DIST_DIR)/,$(TARGET))

%.o: %.cpp %.h
	$(CC) $(CPPFLAGS) -o $@ -c $<

$(DIST_DIR):
	mkdir -p $(DIST_DIR)

$(DIST_DIR)/$(FS_STATUS): $(FS_STATUS).o $(LIBSTOCKER_COMMON)
	$(CC) $(CPPFLAGS) -o $@ $^ $(LIBFLAG)

$(DIST_DIR)/$(MEM_STATUS): $(MEM_STATUS).o $(LIBSTOCKER_COMMON)
	$(CC) $(CPPFLAGS) -o $@ $^ $(LIBFLAG)

$(LIBSTOCKER_COMMON):
	make -C $(COMMON_MODULE_DIR)

clean:
	rm -f $(addprefix $(DIST_DIR)/,$(TARGET)) $(OBJS) *~
	make -C $(COMMON_MODULE_DIR) clean

install:
	mkdir -p $(CGI_DIR)
	cp $(addprefix $(DIST_DIR)/,$(TARGET)) $(CGI_DIR)
