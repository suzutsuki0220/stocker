FROM stocker_webui
RUN apt-get install -y nasm
WORKDIR /stocker

CMD make -C container/webui/make/libs && make && npm install
