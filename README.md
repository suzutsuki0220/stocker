# インストール

`make` と `make install` を実行してください

```
$ make
# make install
```

## インストール先の変更

指定しなければ `/var/www` にインストールされます。変更するには `DESTDIR` `CGI_DIR` `DOCS_DIR` を指定してください

```
# make install DESTDIR=/srv/www CGI_DIR=/srv/www/stocker/cgi-bin DOCS_DIR=/srv/www/stocker/htdocs
```

# アクセス

webブラウザから `/cgi-bin/stocker/stocker.cgi` を開いてください

# 設定

## 扱うディレクトリの設定

`basedirs.conf` にstockerで扱うディレクトリを記述します

/var/www/stocker/conf/basedirs

例:

```
共有=/home/www
```

左辺にListで表示されるディレクトリ名、右辺に扱うディレクトリの絶対パスを指定してください

## SELinuxが有効の場合

stockerで扱うディレクトリとcacheディレクトリに httpd_sys_rw_content_t コンテキストを設定してください

例: /var/www/stocker/cache に httpd_sys_rw_content_t コンテキストを設定する

```
# chcon -R system_u:object_r:httpd_sys_rw_content_t:s0 /var/www/stocker/cache
```

# アンインストール

以下のディレクトリを削除してください

* /var/www/stocker  (/var/www はDESTDIR)
* /var/www/html/stocker  (DOCS_DIRに指定したディレクトリ)
* /var/www/cgi-bin/stocker  (CGI_DIRに指定したディレクトリ)

