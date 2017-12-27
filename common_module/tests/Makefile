debug=1

TEST_URL_PATH_PROG=test_UrlPath
TEST_URL_PATH_SRC=test_UrlPath.cpp
TEST_PROGS+=$(TEST_URL_PATH_PROG)

OBJECTS=../*.o
CC=gcc
CPP=g++

ifeq ($(debug), 1)
	CFLAGS=-g -Wall -fPIC
else
	CFLAGS=-O2 -Wall -DNDEBUG -fPIC
endif
CFLAGS+=-I../

CPPFLAGS=$(CFLAGS)

DESTDIR   = /var/www
CGI_DIR   = $(DESTDIR)/cgi-bin/stocker
BASE_DIR  = $(DESTDIR)/stocker
BIN_DIR   = $(BASE_DIR)/bin
CONF_DIR  = $(BASE_DIR)/conf

.phony: all clean install test

all: $(TEST_URL_PATH_PROG)

$(OBJECTS):
	make -C ../

clean:
	$(RM) $(TEST_URL_PATH_PROG) *~

$(TEST_URL_PATH_PROG): $(TEST_URL_PATH_SRC) $(OBJECTS)
	$(CPP) $(CPPFLAGS) -o $@ $^

test: $(TEST_PROGS)
	$(TEST_PROGS)

