.PHONY: all clean install

all: build-libs install-libs
	make -C ffmpeg

build-libs:
	cd ./x265; ./build-x265.sh
	make -C libopus
	make -C fdk-aac

install-libs:
	make -C x265/build/linux install
	make -C libopus install
	make -C fdk-aac install

install: install-libs
	make -C ffmpeg install

clean:
	make -C x265/build/linux clean
	make -C libopus clean
	make -C fdk-aac clean
	make -C ffmpeg clean
