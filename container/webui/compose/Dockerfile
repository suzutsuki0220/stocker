FROM nginx

RUN apt-get -q clean && apt-get -q update && apt-get -q install -y spawn-fcgi fcgiwrap \
    && apt-get -q install -y build-essential libexif-dev libtaglib-cil-dev imagemagick libmagick++-dev
    && apt-get -q install libavcodec-dev libavformat-dev libavutil-dev libcgi-pm-perl
RUN sed -i 's/www-data/nginx/g' /etc/init.d/fcgiwrap
RUN chown nginx:nginx /etc/init.d/fcgiwrap
ADD ./vhost.conf /etc/nginx/conf.d/default.conf
WORKDIR /var/www

CMD /etc/init.d/fcgiwrap start \
    && nginx -g 'daemon off;'
