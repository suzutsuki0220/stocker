.PHONY: all clean install

all:
	cd ./x265; ./build-x265.sh
	make -C ffmpeg

install:
	make -C x265/build/linux install
	make -C ffmpeg install

clean:
	make -C x265/build/linux clean
	make -C ffmpeg clean
