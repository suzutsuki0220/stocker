debug=1

TEST_URL_PATH_PROG=test_UrlPath
TEST_URL_PATH_HEADERS=Inc/test_UrlPath_*_check_patterns.h
TEST_PROGS+=$(TEST_URL_PATH_PROG)

TEST_FILEUTIL_PROG=test_FileUtil
TEST_FILEUTIL_HEADERS=Inc/test_FileUtil_*_check_patterns.h
TEST_PROGS+=$(TEST_FILEUTIL_PROG)

LIBSTOCKER_COMMON=../libstockercommon.a
CC=gcc
CPP=g++

ifeq ($(debug), 1)
	CFLAGS=-g -Wall -fPIC
else
	CFLAGS=-O2 -Wall -DNDEBUG -fPIC
endif
CFLAGS+=-I../ -I./Inc

CPPFLAGS=$(CFLAGS)

DESTDIR   = /var/www
CGI_DIR   = $(DESTDIR)/cgi-bin/stocker
BASE_DIR  = $(DESTDIR)/stocker
BIN_DIR   = $(BASE_DIR)/bin
CONF_DIR  = $(BASE_DIR)/conf

.phony: all clean install test

all: $(TEST_PROGS)

$(LIBSTOCKER_COMMON):
	make -C ../

clean:
	$(RM) $(TEST_PROGS) *~ Inc/*~ Conf/*~

$(TEST_URL_PATH_PROG): $(TEST_URL_PATH_PROG).cpp $(TEST_URL_PATH_HEADERS) $(LIBSTOCKER_COMMON)
	$(CPP) $(CPPFLAGS) -o $@ $< $(LIBSTOCKER_COMMON)

$(TEST_FILEUTIL_PROG): $(TEST_FILEUTIL_PROG).cpp $(TEST_FILEUTIL_HEADERS) $(LIBSTOCKER_COMMON)
	$(CPP) $(CPPFLAGS) -o $@ $< $(LIBSTOCKER_COMMON)

test: $(TEST_PROGS)
	for prog in $(TEST_PROGS); do $${prog}; done

