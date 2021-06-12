FROM debian:stable-slim

RUN apt-get -q clean && apt-get -q update && apt-get -q install -y build-essential curl git mercurial cmake nasm
RUN curl -sL https://deb.nodesource.com/setup_14.x | bash - && apt-get install -y nodejs
RUN apt-get -q install -y fontconfig libexif-dev libtag-extras-dev imagemagick libmagick++-dev libpango1.0-dev libgnutls28-dev libssl-dev libogg-dev libvorbis-dev

WORKDIR /stocker
EXPOSE 3030

CMD make -C container/libs install && npm install && npm start
