debug=1

TARGET=fs_status
SRC=fs_status.cpp
OBJS=$(SRC:.cpp=.o)
LIBFLAG=-L./
CC=g++

COMMON_MODULE=../common_module/libstockercommon.a

ifeq ($(debug), 1)
	CFLAGS=-g -Wall
else
	CFLAGS=-O2 -Wall
endif
CFLAGS+= -I../common_module

CPPFLAGS=$(CFLAGS)

.PHONY: all clean

all: $(TARGET) $(COMMON_MODULE)

%.o: %.cpp %.h
	$(CC) $(CPPFLAGS) -o $@ -c $<

$(TARGET): $(OBJS) $(COMMON_MODULE)
	$(CC) $(CPPFLAGS) -o $@ $^ $(LIBFLAG)

$(COMMON_MODULE):
	make -C ../common_module

clean:
	rm -f $(TARGET) $(OBJS) *~
	make -C ../common_module clean
