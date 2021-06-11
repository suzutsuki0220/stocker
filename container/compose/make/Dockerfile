FROM stocker_webui
WORKDIR /stocker

CMD make -C container/libs && make -C container/libs install && make && npm install
