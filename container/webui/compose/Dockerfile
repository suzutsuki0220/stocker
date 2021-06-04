FROM debian:stable-slim

RUN apt-get -q clean && apt-get -q update && apt-get -q install -y curl git mercurial cmake \
    && apt-get -q install -y build-essential fontconfig libexif-dev libtag-extras-dev imagemagick libmagick++-dev libpango1.0-dev
RUN curl -sL https://deb.nodesource.com/setup_14.x | bash - && apt-get install -y nodejs

WORKDIR /stocker
EXPOSE 3030

CMD npm start
