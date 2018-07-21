var mapPlaybackRoute = function(m) {
    this.ins_map = m;  // GoogleMapインスタンス
    this.marker = null;
    this.started = false;
    this.pos_index = 0;

    this.info = null;
    this.info_opened = false;
};

mapPlaybackRoute.prototype._showInfoWindow = function(map, latlng, message) {
    if (this.info === null) {
        this.info = new google.maps.InfoWindow();
    }
    this.info.setPosition(latlng);
    this.info.setContent('<div style="color: #202020">' + message + '</div>');
    if (this.info_opened === false) {
        this.info.open(map);
        this.info_opened = true;
    }
};

mapPlaybackRoute.prototype._hideInfoWindow = function() {
    if (this.info) {
        this.info.close();
        this.info = null;
    }
    this.info_opened = false;
};

mapPlaybackRoute.prototype.start = function(positions, index) {
    this.pos_index = index;
    var self = this;

    var moveMarker = function(marker, map) {
        var p = positions[self.pos_index];
        if (p) {
            if (isValidLatLng(p.latitude, p.longitude) === true) {
                var latlng = new google.maps.LatLng(p.latitude, p.longitude);

                marker.setPosition(latlng);
                map.panTo(latlng);
            }
            if (p.scene && p.scene === "stop") {
                self._showInfoWindow(map, latlng, "停止中");
            } else {
                self._hideInfoWindow();
            }
            self.outputPlaybackInfo(p);

            self.pos_index++;
            if (self.pos_index < positions.length - 1) {
                var next_wait;
                const p_next = positions[self.pos_index + 1];
                const s = getDateFromDatetimeString(p.datetime);
                const e = getDateFromDatetimeString(p_next.datetime);
                if (isNaN(s) || isNaN(e)) {
                  next_wait = 100;
                } else {
                  next_wait = e - s;
                }
                setTimeout(function(){moveMarker(marker, map);}, next_wait);
            } else {
                self.hidePlaybackInfo();
                self._showInfoWindow(map, latlng, "走行終了");
                self.started = false;
            }
        } else {
            self.started = false;
        }
    };

    if (this.started === true) {
        this.stop(); // かり
        return;
    }

    // マップの表示を変える (好み)
    this.ins_map.setMapTypeId('satellite');
    this.ins_map.setZoom(17);

    if (this.marker === null) {
        this.marker = new mapCarMarker(this.ins_map);
    }

    moveMarker(this.marker, this.ins_map);
    this.showPlaybackInfo();
    this.marker.setVisible(true);
    this.started = true;
};

mapPlaybackRoute.prototype.stop = function() {
    this.pos_index = positions.length;
    this.hidePlaybackInfo();
    this._hideInfoWindow();

    if (this.started === false) {
        return;
    }

    this.marker.setVisible(false);
    this.marker = null;
    this.started = false;
};

mapPlaybackRoute.prototype.showPlaybackInfo = function() {
    document.getElementById('playback_status').style.display = 'inline';
};

mapPlaybackRoute.prototype.hidePlaybackInfo = function() {
    document.getElementById('playback_status').style.display = 'none';
};

mapPlaybackRoute.prototype.outputPlaybackInfo = function(p) {
    var content = "【再生中】<br>";
    if (isValidLatLng(p.latitude, p.longitude) === true) {
        var speed_str = "-----";
        if (p.speed) {
            speed_str = new String(Math.floor(p.speed * 100) / 100);
        }
        content += p.datetime + "<br>";
        content += "Speed: " + speed_str + "km/h";
    } else {
        content = "無効な位置情報のため更新されません";
    }
    document.getElementById('playback_status').innerHTML = content;
};
