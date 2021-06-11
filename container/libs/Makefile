.PHONY: all clean install

all: build-libs install-libs
	make -C ffmpeg

build-libs:
	cd ./x265; ./build-x265.sh
	make -C libopus
	make -C fdk-aac
	make -C libgsm
	make -C libmp3lame
	make -C libspeex
	make -C libtheora
	make -C libvidstab
	make -C vo-amrwbenc
	make -C libvpx
	make -C x264

install-libs:
	make -C x265/x265/build/linux install
	make -C libopus install
	make -C fdk-aac install
	make -C libgsm install
	make -C libmp3lame install
	make -C libspeex install
	make -C libtheora install
	make -C libvidstab install
	make -C vo-amrwbenc install
	make -C libvpx install
	make -C x264 install

install: install-libs
	make -C ffmpeg install

clean:
	make -C x265/x265/build/linux clean
	make -C libopus clean
	make -C fdk-aac clean
	make -C libgsm clean
	make -C libmp3lame clean
	make -C ffmpeg clean
	make -C libspeex clean
	make -C libtheora clean
	make -C libvidstab clean
	make -C vo-amrwbenc clean
	make -C libvpx clean
	make -C x264 clean
