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
    var behavior_after_samples = 0;
    var distance_from_last_streetview = 0;
    var last_lat = NaN;
    var last_lng = NaN;

    var moveMarker = function(marker, map) {
        var p = positions[self.pos_index];
        if (p) {
            if (isNaN(last_lat)) {
                last_lat = p.latitude;
            }
            if (isNaN(last_lng)) {
                last_lng = p.longitude;
            }

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
                behavior_after_samples = 0;
            } else if (p.behavior && p.behavior !== 0) {
                self._showInfoWindow(map, latlng, makeEventTitle(p.behavior));
                behavior_after_samples = 30;
            } else {
                if (behavior_after_samples === 0) {
                    self._hideInfoWindow();
                } else {
                    self.info.setPosition(latlng);
                    behavior_after_samples--;
                }
            }
            var diff_p = getPositionDifference(positions, self.pos_index, 10)
            self.outputPlaybackInfo(p, diff_p);

            // StreetView追跡
            distance_from_last_streetview += getDistHubeny(p.latitude, p.longitude, last_lat, last_lng, WGS84);
            if (!isNaN(diff_p.azimuth) && (distance_from_last_streetview > 60 || (p.scene && p.scene === "stop" && distance_from_last_streetview > 10))) {
                // 60m離れるか、停止状態になった位置で更新
                if (getPositionLevel(p.horizontal_accuracy, p.vertical_accuracy) <= 1) { // GPS良好or不明
                    setPanoramaPosition(latlng, diff_p.azimuth);
                    distance_from_last_streetview = 0;
                }
            }

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

            last_lat = p.latitude;
            last_lng = p.longitude;
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
        this.ins_map.setMapTypeId(google.maps.MapTypeId.SATELLITE);
        if (this.ins_map.getZoom() < 17) {
            this.ins_map.setZoom(17);
        }

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

mapPlaybackRoute.prototype.outputPlaybackInfo = function(p, diff_p) {
    var gps_status_mes = ["不明", "良好", "低下", "悪い"];
    var content = "【再生中】<br>";
    content += p.datetime + "<br>";
    if (isValidLatLng(p.latitude, p.longitude) === true) {
        var gps_level = getPositionLevel(p.horizontal_accuracy, p.vertical_accuracy);
        content += "GPS感度: " + gps_status_mes[gps_level] + "<br>";
        content += "進行方向: " + diff_p.direction + "<br>";

        var altitude_diff_str = "";
        if (gps_level === 0 || gps_level === 1) {
            if (isNaN(diff_p.altitude) === false) {
                altitude_diff_str = new String(Math.floor(diff_p.altitude * 100) / 100) + "m ";
                if (diff_p.altitude < -0.1) {
                    altitude_diff_str += "↓";
                } else if (diff_p.altitude > 0.1) {
                    altitude_diff_str += "↑";
                } else {
                    altitude_diff_str += "→";
                }
            }
        } else {
            altitude_diff_str = "GPS感度低下のため無効";
        }
        content += "高低差: " + altitude_diff_str + "<br>";

        var speed_str = "----- km/h";
        if (isNaN(p.speed) === false) {
            speed_str = new String(Math.floor(p.speed * 100) / 100) + "km/h";

            if (isNaN(diff_p.speed) === false) {
                if (diff_p.speed < -1.0) {
                    speed_str += " <span style=\"color: red\">↓</span>";
                } else if (diff_p.speed > 1.0) {
                    speed_str += " <span style=\"color: blue\">↑</span>";
                } else {
                    speed_str += " →";
                }
            }
        }
        content += "速度: " + speed_str + "<br>";
    } else {
        content += "無効な位置情報のため更新されません";
    }
    document.getElementById('playback_status').innerHTML = content;
};
