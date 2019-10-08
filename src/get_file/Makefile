debug=1

TARGET=get_file
INC=$(wildcard Inc/*.h Inc/*.hpp)
SRC=$(wildcard *.cpp)
OBJECTS=$(subst .cpp,.o,$(SRC))
CPP=g++

include ../directory_defs.mk

DIST_DIR = ../../dist/cgi-bin

ifeq ($(debug), 1)
	CFLAGS=-g -Wall
else
	CFLAGS=-O2 -Wall -DNDEBUG
endif
CFLAGS+= -I$(COMMON_MODULE_DIR)/Inc

CPPFLAGS=$(CFLAGS)

.phony: all clean install

all: $(DIST_DIR) $(LIBSTOCKER_COMMON) $(addprefix $(DIST_DIR)/,$(TARGET))

$(DIST_DIR):
	mkdir -p $(DIST_DIR)

$(DIST_DIR)/$(TARGET): $(OBJECTS) $(LIBSTOCKER_COMMON)
	$(CPP) $(CPPFLAGS) -o $@ $^

$(LIBSTOCKER_COMMON):
	make -C $(COMMON_MODULE_DIR)

%.o: %.cpp $(INC)
	$(CPP) $(CPPFLAGS) -o $@ -c $<

clean:
	$(RM) $(DIST_DIR)/$(TARGET) $(OBJECTS) *~
	make -C $(COMMON_MODULE_DIR) clean

install:
	mkdir -p $(CGI_DIR)
	cp -r $(DIST_DIR)/$(TARGET) $(CGI_DIR)
