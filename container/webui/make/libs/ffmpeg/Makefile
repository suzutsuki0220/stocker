.PHONY: all clean install

all: build

ffmpeg:
	git clone --depth 1 https://git.ffmpeg.org/ffmpeg.git ffmpeg

install:
	make -C ffmpeg install

clean:
	make -C ffmpeg clean

build: ffmpeg
	cd ffmpeg; \
	./configure \
	    --prefix=/usr \
	    --libdir=/usr/lib \
	    --shlibdir=/usr/lib \
	    --disable-debug \
	    --enable-shared \
	    --enable-gpl \
	    --enable-version3 \
	    --enable-nonfree \
	    --enable-doc \
	    --enable-ffmpeg \
	    --disable-ffplay \
	    --disable-avisynth \
	    --enable-gray \
	    --enable-avdevice \
	    --enable-avcodec \
	    --enable-avformat \
	    --enable-avfilter \
	    --enable-postproc \
	    --enable-bzlib \
	    --enable-fontconfig \
	    --enable-libopus \
	    --enable-swresample \
	    --enable-swscale \
	    --disable-libopencore-amrnb \
	    --disable-libopencore-amrwb \
	    --disable-libopencv \
	    --disable-libdc1394 \
	    --enable-libfdk-aac \
	    --enable-libfreetype \
	    --enable-libgsm \
	    --enable-libmp3lame \
	    --enable-gnutls \
	    --enable-libopenjpeg \
	    --enable-librtmp \
	    --enable-libspeex \
	    --enable-libtheora \
	    --enable-libvidstab \
	    --enable-libvo-amrwbenc \
	    --enable-libvorbis \
	    --enable-libvpx \
	    --enable-libx264 \
	    --enable-libx265 \
	    --disable-libxavs \
	    --enable-zlib \
	|| exit 1
	make -j`nproc` || exit 1

