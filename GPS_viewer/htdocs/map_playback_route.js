var mapPlaybackRoute = function(m) {
    this.ins_map = m;  // GoogleMapインスタンス
    this.marker = null;
    this.playing = false;
    this.pos_index = 0;

    this.info = null;
    this.info_opened = false;
};

mapPlaybackRoute.prototype._showInfoWindow = function(map, latlng, message) {
    if (!latlng || !message) {
        return;
    }

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

mapPlaybackRoute.prototype.isPlaying = function() {
    return this.playing;
}

mapPlaybackRoute.prototype.start = function(positions, start_index, end_index) {
    this.pos_index = start_index;
    var self = this;

    var moveMarker = function(marker, map) {
        var p = positions[self.pos_index];
        if (p) {
            var latlng;
            if (isValidLatLng(p.latitude, p.longitude) === true) {
                latlng = new google.maps.LatLng(p.latitude, p.longitude);
                marker.setPosition(latlng);
                map.setCenter(latlng);
            } else {
                latlng = marker.getPosition();
            }
            if (p.scene && p.scene === "stop") {
                self._showInfoWindow(map, latlng, config.title.scene.stop);
            } else if (p.behavior && p.behavior !== 0) {
                self._showInfoWindow(map, latlng, makeEventTitle(p.behavior));
            } else {
                self._hideInfoWindow();
            }
            self.outputPlaybackInfo(p);

            var start_pos = self.pos_index - 100;
            if (start_pos < 0) {
                start_pos = 0;
            }
            plotAcceleration(positions, start_pos, self.pos_index);

            self.pos_index++;
            if (self.pos_index < end_index) {
                var next_wait;
                const p_next = positions[self.pos_index];
                const s = getDateFromDatetimeString(p.datetime);
                const e = getDateFromDatetimeString(p_next.datetime);
                if (isNaN(s) || isNaN(e)) {
                  next_wait = 100;
                } else {
                    const pb_speed_elem = document.getElementById('playback_speed');
                    if (pb_speed_elem && pb_speed_elem.value) {
                        next_wait = (e - s) / pb_speed_elem.value;
                    } else {
                        next_wait = e - s;
                    }
                }
                setTimeout(function(){moveMarker(marker, map);}, next_wait);
            } else {
                self.hidePlaybackInfo();
                self._showInfoWindow(map, latlng, "走行終了");
                self.playing = false;
            }
        } else {
            self.playing = false;
        }
    };

    if (this.playing === true) {
        this.stop(); // かり
        return;
    }

    if (positions) {
        // マップの表示を変える (好み)
        this.ins_map.setMapTypeId('satellite');
        this.ins_map.setZoom(17);

        if (this.marker === null) {
            this.marker = new mapCarMarker(this.ins_map);
        }

        moveMarker(this.marker, this.ins_map);
        this.showPlaybackInfo();
        this.marker.setVisible(true);
        this.playing = true;
    }
};

mapPlaybackRoute.prototype.stop = function() {
    this.pos_index = positions.length;
    this.hidePlaybackInfo();
    this._hideInfoWindow();

    if (this.playing === false) {
        return;
    }

    this.marker.setVisible(false);
    this.marker = null;
    this.playing = false;
};

mapPlaybackRoute.prototype.showPlaybackInfo = function() {
    document.getElementById('playback_status').style.display = 'inline';
};

mapPlaybackRoute.prototype.hidePlaybackInfo = function() {
    document.getElementById('playback_status').style.display = 'none';
};

mapPlaybackRoute.prototype.outputPlaybackInfo = function(p) {
    var gps_status_mes = ["不明", "良好", "低下", "悪い"];
    var content = "【再生中】<br>";
    content += p.datetime + "<br>";
    if (isValidLatLng(p.latitude, p.longitude) === true) {
        var gps_level = getPositionLevel(p);
        content += "GPS感度: " + gps_status_mes[gps_level] + "<br>";

        var speed_str = "-----";
        if (p.speed) {
            speed_str = new String(Math.floor(p.speed * 100) / 100);
        }
        content += "Speed: " + speed_str + "km/h<br>";
    } else {
        content += "無効な位置情報のため更新されません";
    }
    document.getElementById('playback_status').innerHTML = content;
};
