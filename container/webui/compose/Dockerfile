FROM nginx

RUN apt-get -q clean && apt-get -q update && apt-get -q install -y spawn-fcgi fcgiwrap \
    && apt-get -q install -y build-essential libexif-dev libtaglib-cil-dev imagemagick libmagick++-dev \
    && apt-get -q install -y libavcodec-dev libavformat-dev libavutil-dev libcgi-pm-perl
RUN sed -i 's/www-data/nginx/g' /etc/init.d/fcgiwrap \
    && chown nginx:nginx /etc/init.d/fcgiwrap \
    && mkdir -p /var/www /var/www/stocker \
    && ln -sf /var/www/stocker/repo/htdocs /var/www/html \
    && ln -sf /var/www/stocker/repo/dist/bundle /var/www/bundle \
    && ln -sf /var/www/stocker/repo/dist/config /var/www/stocker/conf \
    && ln -sf /var/www/stocker/repo/src/cgi-bin /var/www/cgi-bin \
    && ln -sf /var/www/stocker/repo/src/perl-modules /var/www/stocker/lib
ADD ./vhost.conf /etc/nginx/conf.d/default.conf
WORKDIR /var/www

CMD /etc/init.d/fcgiwrap start \
    && nginx -g 'daemon off;'
